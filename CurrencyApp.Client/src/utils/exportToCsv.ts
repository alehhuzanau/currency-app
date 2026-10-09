import Papa from 'papaparse';

/**
 * @param rows — массив объектов (ключи = названия колонок)
 * @param filename — имя файла без расширения
 */
export function exportToCsv<T extends object>(rows: T[], filename: string): void {
    if (!rows.length) return;

    const csv = Papa.unparse(rows, {
        quotes: false,
        delimiter: ';',
        newline: '\r\n',
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}