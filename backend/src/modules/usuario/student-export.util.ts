import writeXlsxFile, { type SheetData } from 'write-excel-file/node';
import type { AlumnoExportRow } from './alumno-materia.service';

const HEADERS = [
  'Legajo / DNI',
  'Nombre',
  'Apellido',
  'Correo',
  'Cuenta Gitea',
  'Comisión',
];

const rowValues = (row: AlumnoExportRow) => [
  row.legajo,
  row.nombre,
  row.apellido,
  row.email,
  row.gitea,
  row.comision,
];

// Evita que Excel interprete texto controlado por usuarios como una fórmula.
export const neutralizeSpreadsheetValue = (value: unknown) => {
  const text = String(value ?? '');
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value: unknown) =>
  `"${neutralizeSpreadsheetValue(value).replace(/"/g, '""')}"`;

export const buildStudentsCsv = (rows: AlumnoExportRow[]) => {
  const csvRows = [HEADERS, ...rows.map(rowValues)];
  const contents = csvRows
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\r\n');
  return Buffer.from(`\uFEFF${contents}`, 'utf8');
};

export const buildStudentsWorkbook = async (rows: AlumnoExportRow[]) => {
  const header = HEADERS.map((value) => ({
    value,
    type: String,
    fontWeight: 'bold' as const,
    backgroundColor: '#1D4ED8',
    textColor: '#FFFFFF',
  }));
  const data: SheetData = [
    header,
    ...rows.map((row) =>
      rowValues(row).map((value) => ({
        value: neutralizeSpreadsheetValue(value),
        type: String,
      })),
    ),
  ];

  return writeXlsxFile(data, {
    sheet: 'Alumnos',
    stickyRowsCount: 1,
    columns: [
      { width: 18 },
      { width: 24 },
      { width: 24 },
      { width: 34 },
      { width: 26 },
      { width: 30 },
    ],
  }).toBuffer();
};
