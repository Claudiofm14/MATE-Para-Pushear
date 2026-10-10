import { apiService } from '../shared/services/api.service';

export type ColumnMapping = {
  email?: string;
  firstName?: string;
  lastName?: string;
  legajo?: string;
  fullName?: string;
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

export type StudentImportPreviewResponse = {
  ok: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  headers: string[];
  mapping: ColumnMapping;
  missingColumns: string[];
  items: StudentImportPreviewItem[];
};

export type StudentImportResultItem = {
  rowNumber: number;
  email: string;
  username: string;
  status: 'created' | 'exists' | 'error' | 'skipped';
  message?: string;
};

export type StudentImportResultResponse = {
  ok: boolean;
  total: number;
  created: number;
  exists: number;
  failed: number;
  results: StudentImportResultItem[];
};

class GiteaImportService {
  async preview(file: File, mapping?: ColumnMapping) {
    const formData = this.buildFormData(file, mapping);
    return await apiService.post<StudentImportPreviewResponse>(
      '/api/admin/gitea/import/preview',
      formData
    );
  }

  async confirm(file: File, mapping?: ColumnMapping) {
    const formData = this.buildFormData(file, mapping);
    return await apiService.post<StudentImportResultResponse>(
      '/api/admin/gitea/import/confirm',
      formData
    );
  }

  private buildFormData(file: File, mapping?: ColumnMapping) {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) formData.append('mapping', JSON.stringify(mapping));
    return formData;
  }
}

export const giteaImportService = new GiteaImportService();
