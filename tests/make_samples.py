import os
import pandas as pd

folder = os.path.join(os.path.dirname(__file__), "sample_data")
os.makedirs(folder, exist_ok=True)

df = pd.DataFrame({
    "name": ["Asha", "Ravi", "Meera", "Karan", "Isha"],
    "age": [21, 22, None, 23, 21],
    "city": ["Delhi", "Mumbai", "Pune", None, "Delhi"],
    "score": [78.5, 82.0, 69.25, 91.0, 88.5],
})

# Good files
df.to_csv(os.path.join(folder, "data.csv"), index=False)
df.to_csv(os.path.join(folder, "data.tsv"), sep="\t", index=False)
df.to_csv(os.path.join(folder, "data_semicolon.txt"), sep=";", index=False)
df.to_json(os.path.join(folder, "data.json"), orient="records")
with pd.ExcelWriter(os.path.join(folder, "data.xlsx")) as writer:
    df.to_excel(writer, sheet_name="Students", index=False)
    df.sort_values("score").to_excel(writer, sheet_name="By score", index=False)

# Bad files (should each give a clear error)
open(os.path.join(folder, "empty.csv"), "w").close()
with open(os.path.join(folder, "fake.xlsx"), "w") as f:
    f.write("this is not really an excel file")
with open(os.path.join(folder, "bad.json"), "w") as f:
    f.write("{not valid json")
with open(os.path.join(folder, "notes.txt"), "w") as f:
    f.write("just a sentence with no table structure")

print("Sample files created in", folder)