import pandas as pd


def _num(value):
    """Round a number for JSON. NaN becomes None (JSON null)."""
    if pd.isna(value):
        return None
    return round(float(value), 4)


def profile_dataframe(df):
    n_rows, n_cols = df.shape
    total_cells = n_rows * n_cols

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    missing = df.isna().sum()
    unique = df.nunique(dropna=True)

    # One entry per column: type, missing, unique, constant
    columns = []
    for col in df.columns:
        columns.append({
            "name": col,
            "dtype": str(df[col].dtype),
            "kind": "numerical" if col in numeric_cols else "categorical",
            "missing": int(missing[col]),
            "missing_pct": round(missing[col] / n_rows * 100, 2),
            "unique": int(unique[col]),
            "is_constant": bool(unique[col] <= 1),
        })

    # Mean, median, std, min, max for numerical columns
    numeric_stats = []
    for col in numeric_cols:
        s = df[col]
        numeric_stats.append({
            "name": col, "mean": _num(s.mean()), "median": _num(s.median()),
            "std": _num(s.std()), "min": _num(s.min()), "max": _num(s.max()),
        })

    # Three most frequent values for categorical columns
    categorical_top = []
    for col in categorical_cols:
        counts = df[col].value_counts(dropna=True).head(3)
        categorical_top.append({
            "name": col,
            "top_values": [{"value": str(v), "count": int(c)} for v, c in counts.items()],
        })

    duplicate_rows = int(df.duplicated().sum())
    constant_cols = [c["name"] for c in columns if c["is_constant"]]

    # Data-quality score: the simple average of three percentages (equal weights)
    completeness = (1 - int(missing.sum()) / total_cells) * 100
    uniqueness = (1 - duplicate_rows / n_rows) * 100
    non_constant = (1 - len(constant_cols) / n_cols) * 100
    score = (completeness + uniqueness + non_constant) / 3

    return {
        "n_rows": int(n_rows),
        "n_columns": int(n_cols),
        "n_numerical": len(numeric_cols),
        "n_categorical": len(categorical_cols),
        "total_missing": int(missing.sum()),
        "duplicate_rows": duplicate_rows,
        "constant_columns": constant_cols,
        "memory_kb": round(df.memory_usage(deep=True).sum() / 1024, 1),
        "columns": columns,
        "numeric_stats": numeric_stats,
        "categorical_top": categorical_top,
        "quality": {
            "score": round(score, 1),
            "completeness": round(completeness, 1),
            "uniqueness": round(uniqueness, 1),
            "non_constant": round(non_constant, 1),
            "formula": "Score = average of: completeness (% of cells not missing), "
                       "uniqueness (% of rows not duplicated), "
                       "non-constant columns (% of columns with more than 1 distinct value).",
        },
    }