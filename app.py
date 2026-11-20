import os
import uuid
from modules import profiling

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename

from modules import file_handler
from modules.file_handler import DatasetNotFoundError, FileLoadError

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024   # 50 MB

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if file is None or file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    extension = file_handler.get_extension(file.filename)
    if extension not in file_handler.ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(file_handler.ALLOWED_EXTENSIONS))
        return jsonify({"error": f"Unsupported file type '.{extension}'. Allowed: {allowed}."}), 400

    file_handler.cleanup_old_uploads(UPLOAD_FOLDER)

    dataset_id = uuid.uuid4().hex
    safe_name = secure_filename(file.filename) or f"dataset.{extension}"

    try:
        path = file_handler.save_upload(file, UPLOAD_FOLDER, dataset_id, extension, safe_name)
        sheets = file_handler.get_sheet_names(path, extension)      # None unless Excel
        selected_sheet = sheets[0] if sheets else None
        df = file_handler.load_dataframe(path, extension, selected_sheet)  # validates contents
    except FileLoadError as error:
        file_handler.delete_dataset(UPLOAD_FOLDER, dataset_id)      # don't keep bad files
        return jsonify({"error": str(error)}), 400

    return jsonify({
        "dataset_id": dataset_id,
        "filename": safe_name,
        "format": extension,
        "size_kb": round(os.path.getsize(path) / 1024, 2),
        "sheets": sheets,
        "selected_sheet": selected_sheet,
        "summary": file_handler.dataframe_summary(df),
    })


@app.route("/api/dataset/<dataset_id>/preview")
def preview(dataset_id):
    sheet = request.args.get("sheet")   # e.g. /preview?sheet=Students
    try:
        path, extension, _ = file_handler.find_dataset(UPLOAD_FOLDER, dataset_id)
        df = file_handler.load_dataframe(path, extension, sheet)
    except DatasetNotFoundError as error:
        return jsonify({"error": str(error)}), 404
    except FileLoadError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({
        "selected_sheet": sheet,
        "summary": file_handler.dataframe_summary(df),
    })

@app.route("/api/dataset/<dataset_id>/profile")
def profile(dataset_id):
    sheet = request.args.get("sheet")
    try:
        path, extension, _ = file_handler.find_dataset(UPLOAD_FOLDER, dataset_id)
        df = file_handler.load_dataframe(path, extension, sheet)
    except DatasetNotFoundError as error:
        return jsonify({"error": str(error)}), 404
    except FileLoadError as error:
        return jsonify({"error": str(error)}), 400

    return jsonify(profiling.profile_dataframe(df))
@app.errorhandler(413)
def file_too_large(error):
    return jsonify({"error": "File is too large (limit is 50 MB)."}), 413


if __name__ == "__main__":
    app.run(debug=True)