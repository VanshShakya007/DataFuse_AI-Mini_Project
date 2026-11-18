const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const resultBox = document.getElementById("result");
const datasetSection = document.getElementById("dataset");
const fileInfo = document.getElementById("file-info");
const sheetPicker = document.getElementById("sheet-picker");
const sheetSelect = document.getElementById("sheet-select");
const tableWrap = document.getElementById("table-wrap");

let currentDatasetId = null; // the id the backend gave us; sent with later requests

function showResult(text, isError) {
  resultBox.hidden = false;
  resultBox.className = "result " + (isError ? "error" : "success");
  resultBox.textContent = text;
}

// Build the table with createElement + textContent (never innerHTML),
// so cell values from the file can't inject HTML/JavaScript into the page.
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

    // Worksheet dropdown only for Excel files with 2+ sheets
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
  } catch (err) {
    showResult("Could not reach the server.", true);
  } finally {
    button.disabled = false;
  }
});

// When the user picks another worksheet, ask the backend for that sheet's preview
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
  } catch (err) {
    showResult("Could not reach the server.", true);
  }
});