import { join } from "path";
import ExcelJS from "exceljs";
import { WorkItem } from "./workitem";

export type RowObject = Record<string, string | number | boolean | Date | null>;

function normalizeCellValue(value: ExcelJS.CellValue | null): string | number | boolean | Date | null {
	if (value === null) return null;
	if (value instanceof Date) return value;
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
	if (typeof value === "object") {
		const v: any = value;
		if (v?.text) return String(v.text);
		if (Array.isArray(v?.richText)) return String(v.richText.map((t: any) => t.text).join(""));
		if (v?.result) return typeof v.result === "object" ? String(v.result) : v.result;
	}
	return String(value);
}

/**
 * Reads an Excel file and returns a list of row objects using the first non-empty row as headers.
 * If `sheetName` is provided, tries to use it; otherwise uses the first worksheet.
 */
export async function readExcelFile(filePath: string, sheetName?: string): Promise<RowObject[]> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);

	const worksheet = sheetName
		? workbook.getWorksheet(sheetName) ?? workbook.worksheets[0]
		: workbook.worksheets[0];

	if (!worksheet) return [];

	// Find the first non-empty row to use as headers
	let headerRowIndex = 1;
	for (let r = 1; r <= worksheet.rowCount; r++) {
		const row = worksheet.getRow(r);
		let hasValue = false;
		row.eachCell((cell) => {
			const v = normalizeCellValue(cell.value);
			if (v !== null && v !== "") hasValue = true;
		});
		if (hasValue) { headerRowIndex = r; break; }
	}

	const headerRow = worksheet.getRow(headerRowIndex);
	const headers: string[] = [];
	headerRow.eachCell((cell, col) => {
		const headerValue = normalizeCellValue(cell.value);
		const header = headerValue == null ? `col_${col}` : String(headerValue).trim();
		headers[col] = header || `col_${col}`;
	});

	const rows: RowObject[] = [];
	for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
		const row = worksheet.getRow(r);
		if (!row || row.cellCount === 0) continue;

		const obj: RowObject = {};
		let nonEmpty = false;
		for (let c = 1; c <= headers.length; c++) {
			const key = headers[c] ?? `col_${c}`;
			const value = normalizeCellValue(row.getCell(c).value);
			if (value !== null && value !== "") nonEmpty = true;
			obj[key] = value;
		}
		if (nonEmpty) rows.push(obj);
	}
	return rows;
}

export async function provideDataAsJson(): Promise<string> {
	const rows = await readAndConvertSchaetzungTest()
	return JSON.stringify(rows, null, 2);
}	


export async function toJson(WorkItems: WorkItem[]): Promise<string> {
	return JSON.stringify(WorkItems, null, 2);
}
export async function readAndConvertSchaetzungTest(): Promise<WorkItem[]> {
    const file = join(process.cwd(), "data", "schaetzung_test.xlsx");
    const rows = await readExcelFile(file, "schaetzung_test");
    return convert(rows);
}

function convertVerdict(value: string | number | boolean | Date | null): 'yes' | 'no' | 'maybe' {
    const str = String(value || '').toLowerCase();
    if (str ==='ja' || str === 'yes') {
        return 'yes';
    } else if (str === 'nein' || str === 'no') {
        return 'no';
    }
    return 'maybe';
}

export function convert(source: RowObject[]): Promise<WorkItem[]> {
    return Promise.resolve(source.map((row) => ({
      id: String(row['nummer'] || ''),
      title: String(row['Klageinhalt'] || ''),
      verdict: convertVerdict(row['Urteil']),
      estimate: Number(row['Schätzung'] || 0),
      description: String(row['Kommentar'] || ''),
    })));

}
/** Convenience helper for reading the local schaetzung_test sheet */
export async function readSchaetzungTest(): Promise<RowObject[]> {
	const file = join(process.cwd(), "data", "schaetzung_test.xlsx");
	// Try to pick worksheet named 'schaetzung_test' if it exists
	return readExcelFile(file, "schaetzung_test");
}

