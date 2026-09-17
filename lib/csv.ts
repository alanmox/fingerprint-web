export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number;
};

function escapeCell(value: string | number): string {
  const text = String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(","),
  );
  return [header, ...lines].join("\r\n");
}
