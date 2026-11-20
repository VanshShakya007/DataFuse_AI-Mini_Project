const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const resultBox = document.getElementById("result");
const datasetSection = document.getElementById("dataset");
const fileInfo = document.getElementById("file-info");
const sheetPicker = document.getElementById("sheet-picker");
const sheetSelect = document.getElementById("sheet-select");
const tableWrap = document.getElementById("table-wrap");
const profileBox = document.getElementById("profile");

let currentDatasetId = null;

function showResult(text, isError) {
  resultBox.hidden = false;
  resultBox.className = "result " + (isError ? "error" : "success");
  resultBox.textContent = text;
}

function renderTable(summary) {
  const table = document.createElement("table");

  const headRow = document.createElement("tr");
  summary.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.name;
    const small = document.createElement("small");
    small.textContent = col.dtype;
    th.appendChild(small);
    headRow.appendChild(th);
  });
  const thead = document.createElement("thead");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  summary.preview.forEach((row) => {
    const tr = document.createElement("tr");
    summary.columns.forEach((col) => {
      const td = document.createElement("td");
      const value = row[col.name];
      if (value === null || value === undefined) {
        td.textContent = "missing";
        td.className = "empty";
      } else {
        td.textContent = value;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  tableWrap.replaceChildren(table);
}

function renderSummary(summary, selectedSheet) {
  const sheetText = selectedSheet ? ` | Sheet: ${selectedSheet}` : "";
  fileInfo.textContent =
    `${summary.n_rows} rows x ${summary.n_columns} columns | ` +
    `${summary.memory_kb} KB in memory${sheetText} | Showing first ${summary.preview.length} rows`;
  renderTable(summary);
}

function makeTable(headers, rows) {
  const table = document.createElement("table");
  const headRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  const thead = document.createElement("thead");
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell === null || cell === undefined ? "-" : cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  return wrap;
}

function makeHeading(text) {
  const h = document.createElement("h2");
  h.textContent = text;
  return h;
}

function makeCard(label, value) {
  const card = document.createElement("div");
  card.className = "card";
  const l = document.createElement("div");
  l.className = "label";
  l.textContent = label;
  const v = document.createElement("div");
  v.className = "value";
  v.textContent = value;
  card.append(l, v);
  return card;
}

function renderProfile(p) {
  const cards = document.createElement("div");
  cards.className = "cards";
  cards.append(
    makeCard("Rows", p.n_rows),
    makeCard("Columns", p.n_columns),
    makeCard("Numerical / categorical", `${p.n_numerical} / ${p.n_categorical}`),
    makeCard("Missing cells", p.total_missing),
    makeCard("Duplicate rows", p.duplicate_rows),
    makeCard("Constant columns", p.constant_columns.length),
    makeCard("Memory", `${p.memory_kb} KB`),
    makeCard("Quality score", `${p.quality.score} / 100`)
  );

  const q = p.quality;
  const note = document.createElement("p");
  note.className = "note";
  note.textContent =
    `${q.formula} Here: completeness ${q.completeness}%, ` +
    `uniqueness ${q.uniqueness}%, non-constant ${q.non_constant}%.`;

  const parts = [makeHeading("Dataset profile"), cards, note];

  parts.push(makeHeading("Columns"));
  parts.push(makeTable(
    ["Column", "Type", "Kind", "Missing", "Missing %", "Unique", "Constant"],
    p.columns.map((c) => [c.name, c.dtype, c.kind, c.missing, c.missing_pct, c.unique, c.is_constant ? "yes" : "no"])
  ));

  if (p.numeric_stats.length > 0) {
    parts.push(makeHeading("Numerical columns"));
    parts.push(makeTable(
      ["Column", "Mean", "Median", "Std", "Min", "Max"],
      p.numeric_stats.map((s) => [s.name, s.mean, s.median, s.std, s.min, s.max])
    ));
  }

  if (p.categorical_top.length > 0) {
    parts.push(makeHeading("Categorical columns: most frequent values"));
    parts.push(makeTable(
      ["Column", "Top values (count)"],
      p.categorical_top.map((c) => [
        c.name,
        c.top_values.map((t) => `${t.value} (${t.count})`).join(", "),
      ])
    ));
  }

  profileBox.replaceChildren(...parts);
}

async function loadProfile(sheet) {
  let url = `/api/dataset/${currentDatasetId}/profile`;
  if (sheet) url += `?sheet=${encodeURIComponent(sheet)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      showResult(data.error || "Could not build the profile.", true);
      return;
    }
    renderProfile(data);
  } catch (err) {
    showResult("Could not reach the server.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const button = form.querySelector("button");
  button.disabled = true;
  showResult("Uploading and reading file...", false);

  try {
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) {
      datasetSection.hidden = true;
      showResult(data.error || "Upload failed.", true);
      return;
    }

    currentDatasetId = data.dataset_id;
    showResult(`${data.filename} loaded (format: ${data.format}, ${data.size_kb} KB).`, false);

    if (data.sheets && data.sheets.length > 1) {
      sheetSelect.replaceChildren(
        ...data.sheets.map((name) => new Option(name, name))
      );
      sheetSelect.value = data.selected_sheet;
      sheetPicker.hidden = false;
    } else {
      sheetPicker.hidden = true;
    }

    renderSummary(data.summary, data.selected_sheet);
    datasetSection.hidden = false;
    loadProfile(data.selected_sheet);
  } catch (err) {
    showResult("Could not reach the server.", true);
  } finally {
    button.disabled = false;
  }
});

sheetSelect.addEventListener("change", async () => {
  const sheet = sheetSelect.value;
  try {
    const response = await fetch(
      `/api/dataset/${currentDatasetId}/preview?sheet=${encodeURIComponent(sheet)}`
    );
    const data = await response.json();
    if (!response.ok) {
      showResult(data.error || "Could not load that worksheet.", true);
      return;
    }
    renderSummary(data.summary, sheet);
    loadProfile(sheet);
  } catch (err) {
    showResult("Could not reach the server.", true);
  }
});