export type RawStudentRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type UploadedExcelFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
};

export type ColumnMapping = {
  email?: string;
  firstName?: string;
  lastName?: string;
  legajo?: string;
  fullName?: string;
};

export type NormalizedStudent = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  legajo: string;
  username: string;
};

export type StudentImportPreviewItem = {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  legajoMasked?: string;
  username?: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type StudentImportResultItem = {
  rowNumber: number;
  email: string;
  username: string;
  status: 'created' | 'exists' | 'error' | 'skipped';
  message?: string;
};
