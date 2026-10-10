import {
  buildStudentsCsv,
  buildStudentsWorkbook,
  neutralizeSpreadsheetValue,
} from './student-export.util';

const rows = [
  {
    legajo: '40111222',
    nombre: '=PELIGRO()',
    apellido: 'Alumno',
    email: 'alumno@unahur.edu.ar',
    gitea: 'alumno.gitea',
    comision: 'Comisión 1',
  },
];

describe('student export utilities', () => {
  it('neutraliza formulas y genera CSV UTF-8 compatible con Excel', () => {
    expect(neutralizeSpreadsheetValue('=1+1')).toBe("'=1+1");
    const csv = buildStudentsCsv(rows).toString('utf8');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Legajo / DNI"');
    expect(csv).toContain('"\'=PELIGRO()"');
  });

  it('genera un archivo XLSX real', async () => {
    const workbook = await buildStudentsWorkbook(rows);
    expect(workbook.subarray(0, 2).toString()).toBe('PK');
    expect(workbook.length).toBeGreaterThan(1000);
  });
});
