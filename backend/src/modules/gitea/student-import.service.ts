import { BadRequestException, Injectable } from '@nestjs/common';
import { readSheet, type Row } from 'read-excel-file/node';
import { DataSource } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity';
import {
  createGiteaUser,
  getGiteaUserByUsername,
  mapGiteaError,
} from '../../lib/gitea';
import {
  ColumnMapping,
  NormalizedStudent,
  RawStudentRow,
  StudentImportPreviewItem,
  StudentImportResultItem,
  UploadedExcelFile,
} from './student-import.types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.xlsx'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  email: [
    'email',
    'mail',
    'correo',
    'correo electronico',
    'correo electrónico',
    'e-mail',
  ],
  firstName: ['nombre', 'nombres', 'first name'],
  lastName: ['apellido', 'apellidos', 'last name'],
  legajo: [
    'legajo',
    'dni',
    'documento',
    'numero de documento',
    'número de documento',
    'nro documento',
    'nro_doc',
    'documento_nro',
  ],
  fullName: ['apellido y nombre', 'nombre completo', 'full name', 'alumno'],
};

@Injectable()
export class StudentImportService {
  constructor(private readonly dataSource: DataSource) {}

  validateExcelFile(file?: UploadedExcelFile) {
    if (!file) throw new BadRequestException('Debe subir un archivo Excel');
    if (file.size <= 0) throw new BadRequestException('El archivo está vacío');
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB');
    }

    const lowerName = file.originalname.toLowerCase();
    const validExtension = ALLOWED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext),
    );
    if (!validExtension) {
      throw new BadRequestException('Solo se aceptan archivos .xlsx');
    }
  }

  async preview(file: UploadedExcelFile, mapping?: ColumnMapping) {
    this.validateExcelFile(file);
    const { rows, headers, resolvedMapping } = await this.parseExcel(
      file,
      mapping,
    );
    const items = this.buildPreviewItems(rows, resolvedMapping);

    return {
      ok: true,
      totalRows: items.length,
      validRows: items.filter((item) => item.valid).length,
      invalidRows: items.filter((item) => !item.valid).length,
      headers,
      mapping: resolvedMapping,
      missingColumns: this.getMissingColumns(resolvedMapping),
      items,
    };
  }

  async confirm(file: UploadedExcelFile, mapping?: ColumnMapping) {
    const preview = await this.preview(file, mapping);
    const validStudents = await this.getValidStudents(file, preview.mapping);

    if (validStudents.length === 0) {
      throw new BadRequestException('No hay filas válidas para importar');
    }

    const results = await this.runWithConcurrency(
      validStudents,
      4,
      async (student) => this.createStudentInGitea(student),
    );

    return {
      ok: true,
      total: preview.totalRows,
      created: results.filter((item) => item.status === 'created').length,
      exists: results.filter((item) => item.status === 'exists').length,
      failed: results.filter((item) => item.status === 'error').length,
      results,
    };
  }

  private async parseExcel(file: UploadedExcelFile, mapping?: ColumnMapping) {
    const table = await this.readExcelTable(file);

    if (table.length < 2) {
      throw new BadRequestException(
        'El archivo debe tener encabezados y filas',
      );
    }

    const headers = (table[0] || []).map((header) => String(header).trim());
    const resolvedMapping = {
      ...this.detectColumns(headers),
      ...this.sanitizeMapping(mapping, headers),
    };

    const rows: RawStudentRow[] = table
      .slice(1)
      .map((row, index) => ({
        rowNumber: index + 2,
        values: this.rowToRecord(headers, row),
      }))
      .filter((row) =>
        Object.values(row.values).some((value) => String(value).trim()),
      );

    if (rows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas de alumnos');
    }

    return { rows, headers, resolvedMapping };
  }

  private async readExcelTable(file: UploadedExcelFile): Promise<Row[]> {
    try {
      return await readSheet(file.buffer);
    } catch {
      throw new BadRequestException(
        'No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido y que no esté protegido o dañado.',
      );
    }
  }

  private detectColumns(headers: string[]): ColumnMapping {
    const normalizedHeaders = new Map(
      headers.map((header) => [this.normalizeHeader(header), header]),
    );

    const mapping: ColumnMapping = {};
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [
      keyof ColumnMapping,
      string[],
    ][]) {
      const match = aliases
        .map((alias) => normalizedHeaders.get(this.normalizeHeader(alias)))
        .find(Boolean);
      if (match) mapping[field] = match;
    }

    return mapping;
  }

  private sanitizeMapping(mapping: ColumnMapping = {}, headers: string[]) {
    const allowed = new Set(headers);
    return Object.fromEntries(
      Object.entries(mapping).filter(
        ([, value]) => value && allowed.has(value),
      ),
    ) as ColumnMapping;
  }

  private getMissingColumns(mapping: ColumnMapping) {
    const missing: string[] = [];
    if (!mapping.email) missing.push('email');
    if (!mapping.legajo) missing.push('legajo');
    if (!mapping.firstName && !mapping.fullName) missing.push('nombre');
    if (!mapping.lastName && !mapping.fullName) missing.push('apellido');
    return missing;
  }

  private rowToRecord(headers: string[], row: unknown[]) {
    return headers.reduce<Record<string, unknown>>((record, header, index) => {
      if (header) record[header] = row[index] ?? '';
      return record;
    }, {});
  }

  private buildPreviewItems(
    rows: RawStudentRow[],
    mapping: ColumnMapping,
  ): StudentImportPreviewItem[] {
    const normalizedByRow = rows.map((row) => this.normalizeRow(row, mapping));
    const emailCounts = this.countBy(normalizedByRow.map((item) => item.email));
    const usernameCounts = this.countBy(
      normalizedByRow.map((item) => item.username),
    );
    const legajoCounts = this.countBy(
      normalizedByRow.map((item) => item.legajo),
    );

    return normalizedByRow.map((student) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!student.email || !EMAIL_REGEX.test(student.email)) {
        errors.push('Email inválido');
      }
      if (!student.firstName) errors.push('Nombre obligatorio');
      if (!student.lastName) errors.push('Apellido obligatorio');
      if (!student.legajo) errors.push('Legajo/DNI obligatorio');
      if (student.legajo.length > 64) {
        errors.push('Legajo/DNI demasiado largo (máximo 64 caracteres)');
      }
      if (!student.username) errors.push('No se pudo generar username');
      if (student.email && emailCounts.get(student.email) > 1) {
        errors.push('Email duplicado en la planilla');
      }
      if (student.username && usernameCounts.get(student.username) > 1) {
        errors.push('Username duplicado en la planilla');
      }
      if (student.legajo && legajoCounts.get(student.legajo) > 1) {
        errors.push('Legajo/DNI duplicado en la planilla');
      }
      if (mapping.fullName && (!mapping.firstName || !mapping.lastName)) {
        warnings.push(
          'Nombre y apellido fueron inferidos desde nombre completo',
        );
      }

      return {
        rowNumber: student.rowNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        email: student.email,
        legajoMasked: this.maskLegajo(student.legajo),
        username: student.username,
        valid: errors.length === 0,
        errors,
        warnings,
      };
    });
  }

  async getValidStudents(file: UploadedExcelFile, mapping: ColumnMapping) {
    const { rows } = await this.parseExcel(file, mapping);
    const previewItems = this.buildPreviewItems(rows, mapping);
    const validRows = new Set(
      previewItems.filter((item) => item.valid).map((item) => item.rowNumber),
    );

    return rows
      .map((row) => this.normalizeRow(row, mapping))
      .filter((student) => validRows.has(student.rowNumber));
  }

  private normalizeRow(
    row: RawStudentRow,
    mapping: ColumnMapping,
  ): NormalizedStudent {
    const rawEmail = this.normalizeEmail(this.getValue(row, mapping.email));
    const legajo = this.normalizeLegajo(this.getValue(row, mapping.legajo));
    let firstName = this.normalizeName(this.getValue(row, mapping.firstName));
    let lastName = this.normalizeName(this.getValue(row, mapping.lastName));

    if ((!firstName || !lastName) && mapping.fullName) {
      const inferred = this.splitFullName(this.getValue(row, mapping.fullName));
      firstName ||= inferred.firstName;
      lastName ||= inferred.lastName;
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const username = this.generateUsername(
      rawEmail,
      firstName,
      lastName,
      legajo,
    );

    return {
      rowNumber: row.rowNumber,
      firstName,
      lastName,
      fullName,
      email: rawEmail,
      legajo,
      username,
    };
  }

  private async createStudentInGitea(
    student: NormalizedStudent,
  ): Promise<StudentImportResultItem> {
    let username = student.username;
    let status: StudentImportResultItem['status'] = 'created';

    try {
      username = await this.resolveAvailableUsername(student);
      if (!username) {
        return {
          rowNumber: student.rowNumber,
          email: student.email,
          username: student.username,
          status: 'exists',
          message: 'No se encontró un username disponible en Gitea',
        };
      }

      await this.createGiteaUserWithRetry({
        email: student.email,
        fullName: student.fullName,
        username,
        temporaryPassword: student.legajo,
      });
    } catch (error) {
      const mapped = mapGiteaError(error);
      if (mapped.status !== 409) {
        return {
          rowNumber: student.rowNumber,
          email: student.email,
          username,
          status: 'error',
          message: mapped.message,
        };
      }
      status = 'exists';
    }

    try {
      await this.persistStudentIdentity(student, username);
    } catch {
      return {
        rowNumber: student.rowNumber,
        email: student.email,
        username,
        status: 'error',
        message: 'No se pudo almacenar el legajo/DNI en la plataforma',
      };
    }

    return {
      rowNumber: student.rowNumber,
      email: student.email,
      username,
      status,
      message:
        status === 'created'
          ? 'Usuario creado y legajo almacenado'
          : 'Usuario existente y legajo actualizado',
    };
  }

  private async persistStudentIdentity(
    student: NormalizedStudent,
    username: string,
  ) {
    const usuarioRepository = this.dataSource.getRepository(Usuario);
    let usuario = await usuarioRepository.findOne({
      where: { email: student.email },
    });

    if (!usuario) {
      usuario = usuarioRepository.create({
        email: student.email,
        nombre: student.firstName,
        apellido: student.lastName,
        rol: 'alumno',
        githubUser: username || null,
        legajo: student.legajo,
      });
    } else {
      usuario.nombre ||= student.firstName;
      usuario.apellido ||= student.lastName;
      usuario.githubUser ||= username || null;
      usuario.legajo = student.legajo;
    }

    await usuarioRepository.save(usuario, { reload: false });
  }

  private async resolveAvailableUsername(student: NormalizedStudent) {
    const suffix = student.legajo ? `-${student.legajo}` : '';
    const candidates = [
      student.username,
      suffix ? `${student.username}${suffix}` : '',
      ...Array.from({ length: 5 }).map(
        (_, index) => `${student.username}-${index + 2}`,
      ),
    ].filter(Boolean);

    for (const candidate of candidates) {
      const username = candidate.slice(0, 40);
      const existing = await getGiteaUserByUsername(username);
      if (!existing) return username;
    }

    return null;
  }

  private async createGiteaUserWithRetry(
    input: Parameters<typeof createGiteaUser>[0],
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await createGiteaUser(input);
      } catch (error) {
        lastError = error;
        const mapped = mapGiteaError(error);
        if (![429, 502, 503, 504].includes(mapped.status)) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 300 * (attempt + 1)),
        );
      }
    }
    throw lastError;
  }

  private async runWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<R>,
  ) {
    const results: R[] = [];
    let cursor = 0;

    const runners = Array.from({
      length: Math.min(concurrency, items.length),
    }).map(async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index]);
      }
    });

    await Promise.all(runners);
    return results;
  }

  private getValue(row: RawStudentRow, key?: string) {
    return key ? String(row.values[key] ?? '').trim() : '';
  }

  private normalizeHeader(value: string) {
    return this.removeAccents(value).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private normalizeName(value: string) {
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeLegajo(value: string) {
    return value.replace(/[.\s-]/g, '').trim();
  }

  private splitFullName(value: string) {
    const normalized = this.normalizeName(value);
    if (!normalized) return { firstName: '', lastName: '' };

    if (normalized.includes(',')) {
      const [lastName, firstName] = normalized.split(',', 2);
      return {
        firstName: this.normalizeName(firstName || ''),
        lastName: this.normalizeName(lastName || ''),
      };
    }

    const parts = normalized.split(' ');
    if (parts.length === 1)
      return { firstName: this.toTitleCase(parts[0]), lastName: '' };
    return {
      firstName: this.toTitleCase(parts.slice(0, -1).join(' ')),
      lastName: this.toTitleCase(parts.slice(-1).join(' ')),
    };
  }

  private normalizeEmail(value: string) {
    const match = value
      .toLowerCase()
      .match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
    return match ? match[0].trim() : value.toLowerCase().trim();
  }

  private generateUsername(
    email: string,
    firstName: string,
    lastName: string,
    legajo: string,
  ) {
    const emailPrefix = email.includes('@') ? email.split('@')[0] : '';
    const base = emailPrefix || `${firstName}.${lastName}`;
    const username = this.sanitizeUsername(base);
    if (username) return username.slice(0, 40);
    return this.sanitizeUsername(`alumno-${legajo}`).slice(0, 40);
  }

  private sanitizeUsername(value: string) {
    return this.removeAccents(value)
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/[.-]{2,}/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '');
  }

  private removeAccents(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private toTitleCase(value: string) {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private maskLegajo(value: string) {
    if (!value) return '';
    const suffix = value.slice(-3);
    return `${'*'.repeat(Math.max(value.length - 3, 0))}${suffix}`;
  }

  private countBy(values: string[]) {
    return values.reduce<Map<string, number>>((counts, value) => {
      if (!value) return counts;
      counts.set(value, (counts.get(value) || 0) + 1);
      return counts;
    }, new Map());
  }
}
