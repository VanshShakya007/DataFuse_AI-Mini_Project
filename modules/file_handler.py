import csv
import json
import os
import time
import uuid

import pandas as pd

ALLOWED_EXTENSIONS = {"csv", "tsv", "txt", "json", "xlsx", "xls"}
EXCEL_EXTENSIONS = {"xlsx", "xls"}


class FileLoadError(Exception):
    """Raised with a user-friendly message when a file can't be used."""


class DatasetNotFoundError(FileLoadError):
    """Raised when a dataset id is invalid or the file has expired."""


def get_extension(filename):
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower()


# ---------------------------------------------------------------
# Storage helpers: save, find, delete, clean up
# ---------------------------------------------------------------
def _validate_id(dataset_id):
    """Only accept real UUIDs, so ids can't be used for path tricks like '../'."""
    try:
        return uuid.UUID(dataset_id).hex
    except (ValueError, AttributeError, TypeError):
        raise DatasetNotFoundError("Invalid dataset id.")


def save_upload(file_storage, folder, dataset_id, extension, original_name):
    path = os.path.join(folder, f"{dataset_id}.{extension}")
    file_storage.save(path)

    meta = {"filename": original_name, "extension": extension}
    with open(os.path.join(folder, f"{dataset_id}.meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f)

    if os.path.getsize(path) == 0:
        raise FileLoadError("The file is empty.")
    return path


def find_dataset(folder, dataset_id):
    """Return (path, extension, original_filename) for a stored dataset."""
    dataset_id = _validate_id(dataset_id)
    meta_path = os.path.join(folder, f"{dataset_id}.meta.json")
    not_found = DatasetNotFoundError(
        "Dataset not found. It may have expired, so please upload the file again."
    )
    if not os.path.exists(meta_path):
        raise not_found

    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)
    path = os.path.join(folder, f"{dataset_id}.{meta['extension']}")
    if not os.path.exists(path):
        raise not_found
    return path, meta["extension"], meta["filename"]


def delete_dataset(folder, dataset_id):
    dataset_id = _validate_id(dataset_id)
    for name in os.listdir(folder):
        if name.startswith(dataset_id):
            try:
                os.remove(os.path.join(folder, name))
            except OSError:
                pass


def cleanup_old_uploads(folder, max_age_hours=24):
    cutoff = time.time() - max_age_hours * 3600
    for name in os.listdir(folder):
        if name == ".gitkeep":
            continue
        path = os.path.join(folder, name)
        try:
            if os.path.isfile(path) and os.path.getmtime(path) < cutoff:
                os.remove(path)
        except OSError:
            pass


# ---------------------------------------------------------------
# Reading files into DataFrames
# ---------------------------------------------------------------
def _excel_engine(extension):
    return "openpyxl" if extension == "xlsx" else "xlrd"


def get_sheet_names(path, extension):
    """Return worksheet names for Excel files, or None for other formats."""
    if extension not in EXCEL_EXTENSIONS:
        return None
    try:
        with pd.ExcelFile(path, engine=_excel_engine(extension)) as excel:
            return excel.sheet_names
    except ImportError:
        raise FileLoadError("Reading this Excel format needs a missing package. Run: pip install openpyxl xlrd")
    except Exception:
        raise FileLoadError("Could not open the Excel file. It may be corrupted or not a real Excel file.")


def _read_text_table(path, sep):
    """Read CSV/TSV/TXT. sep=None lets pandas detect the delimiter."""
    engine = "python" if sep is None else "c"

    def read(encoding):
        return pd.read_csv(path, sep=sep, engine=engine, encoding=encoding)

    try:
        return read("utf-8-sig")        # utf-8, also handles the BOM Excel adds
    except UnicodeDecodeError:
        return read("latin-1")          # fallback for older Windows-encoded files


def _read_json(path):
    with open(path, encoding="utf-8-sig") as f:
        data = json.load(f)

    # Accept a wrapper like {"data": [ ... ]} if it has exactly one list inside
    if isinstance(data, dict):
        lists = [v for v in data.values() if isinstance(v, list)]
        if len(lists) != 1:
            raise FileLoadError("JSON must be a list of records, for example [{...}, {...}].")
        data = lists[0]

    if not isinstance(data, list) or len(data) == 0:
        raise FileLoadError("JSON must be a non-empty list of records.")
    if not all(isinstance(row, dict) for row in data):
        raise FileLoadError("Every item in the JSON list must be an object like {\"column\": value}.")

    return pd.json_normalize(data)      # also flattens nested objects into columns


def _read_excel(path, extension, sheet_name):
    sheets = get_sheet_names(path, extension)
    if sheet_name is None:
        sheet_name = sheets[0]
    if sheet_name not in sheets:
        raise FileLoadError(f"Worksheet '{sheet_name}' was not found in this file.")
    return pd.read_excel(path, sheet_name=sheet_name, engine=_excel_engine(extension))


def load_dataframe(path, extension, sheet_name=None):
    """Read any supported file into a DataFrame, or raise FileLoadError."""
    try:
        if extension == "csv":
            df = _read_text_table(path, sep=",")
        elif extension == "tsv":
            df = _read_text_table(path, sep="\t")
        elif extension == "txt":
            df = _read_text_table(path, sep=None)
            if df.shape[1] < 2:
                raise FileLoadError(
                    "Could not detect a delimiter in this text file. "
                    "Use a consistent separator such as comma, semicolon, tab or |."
                )
        elif extension == "json":
            df = _read_json(path)
        elif extension in EXCEL_EXTENSIONS:
            df = _read_excel(path, extension, sheet_name)
        else:
            raise FileLoadError(f"Unsupported file type '.{extension}'.")
    except FileLoadError:
        raise
    except pd.errors.EmptyDataError:
        raise FileLoadError("The file contains no data.")
    except pd.errors.ParserError as error:
        raise FileLoadError(f"The file could not be parsed as a table: {error}")
    except json.JSONDecodeError:
        raise FileLoadError("The file is not valid JSON.")
    except csv.Error:
        raise FileLoadError("Could not detect a delimiter in this text file.")
    except Exception as error:
        raise FileLoadError(f"Could not read the file: {error}")

    if df.shape[0] == 0 or df.shape[1] == 0:
        raise FileLoadError("The file was read, but it has no data rows.")

    df.columns = [str(c) for c in df.columns]   # keep column names as text everywhere
    return df


def dataframe_summary(df, preview_rows=10):
    """Convert a DataFrame to JSON-safe info for the frontend."""
    # to_json writes NaN as null. Plain jsonify would write NaN, which is
    # NOT valid JSON, and the browser's response.json() would fail on it.
    preview = json.loads(df.head(preview_rows).to_json(orient="records", date_format="iso"))
    return {
        "n_rows": int(df.shape[0]),
        "n_columns": int(df.shape[1]),
        "columns": [{"name": name, "dtype": str(dtype)} for name, dtype in df.dtypes.items()],
        "preview": preview,
        "memory_kb": round(df.memory_usage(deep=True).sum() / 1024, 1),
    }