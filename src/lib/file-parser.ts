import * as XLSX from "xlsx";

export type ParsedFile = {
  csvText: string;
  fileName: string;
  sheetName?: string;
};

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export function isAcceptedFileType(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Reads a File and returns CSV text.
 * CSV files are read as text directly.
 * Excel files are parsed with SheetJS and the first sheet is converted to CSV.
 */
export function parseFileToCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          if (!firstSheet) {
            reject(new Error("Excel file has no sheets"));
            return;
          }
          const sheet = workbook.Sheets[firstSheet];
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          resolve({ csvText, fileName: file.name, sheetName: firstSheet });
        } catch (err) {
          reject(
            new Error(
              `Failed to parse Excel file: ${err instanceof Error ? err.message : "unknown error"}`
            )
          );
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve({ csvText: text, fileName: file.name });
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    }
  });
}
