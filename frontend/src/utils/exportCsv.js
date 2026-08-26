/**
 * ==========================================================================
 * Universal CSV / Excel Export Utility for IEM LMS
 * Includes UTF-8 BOM for flawless Excel rendering on Windows/Mac
 * ==========================================================================
 */

/**
 * Escapes a cell value for standard RFC 4180 CSV compliance
 */
const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  } else {
    str = `"${str}"`;
  }
  return str;
};

/**
 * Export data array as a downloadable CSV file
 * @param {Array<Object>} data - Array of objects to export
 * @param {Array<{ label: string, key: string | Function }>} columns - Column definitions
 * @param {string} filenamePrefix - Prefix for downloaded file
 */
export const exportToCSV = (data = [], columns = [], filenamePrefix = "export") => {
  if (!Array.isArray(data) || data.length === 0) {
    alert("No records available to export.");
    return false;
  }

  try {
    // 1. Build Header Row
    const headerRow = columns.map((col) => escapeCsvCell(col.label)).join(",");

    // 2. Build Data Rows
    const dataRows = data.map((row, rowIndex) => {
      return columns
        .map((col) => {
          let cellValue = "";
          if (typeof col.key === "function") {
            cellValue = col.key(row, rowIndex);
          } else if (col.key) {
            cellValue = row[col.key];
          }
          return escapeCsvCell(cellValue);
        })
        .join(",");
    });

    // 3. Combine with UTF-8 Byte Order Mark (BOM) for Excel
    const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

    // 4. Create Blob & Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateStamp = new Date().toISOString().slice(0, 10);
    const timeStamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "-");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filenamePrefix}_${dateStamp}_${timeStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("CSV Export failed:", error);
    alert("Failed to export data. Please check browser permissions.");
    return false;
  }
};
