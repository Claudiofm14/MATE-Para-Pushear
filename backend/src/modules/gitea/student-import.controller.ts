import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { StudentImportService } from './student-import.service';
import { ColumnMapping, UploadedExcelFile } from './student-import.types';

@Controller('api/admin/gitea/import')
@Roles(USER_ROLES.ADMIN)
export class StudentImportController {
  constructor(private readonly studentImportService: StudentImportService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  async preview(
    @UploadedFile() file: UploadedExcelFile,
    @Body('mapping') mapping?: string,
  ) {
    return await this.studentImportService.preview(
      file,
      this.parseMapping(mapping),
    );
  }

  @Post('confirm')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  confirm(
    @UploadedFile() file: UploadedExcelFile,
    @Body('mapping') mapping?: string,
  ) {
    return this.studentImportService.confirm(file, this.parseMapping(mapping));
  }

  private parseMapping(mapping?: string): ColumnMapping | undefined {
    if (!mapping) return undefined;
    try {
      return JSON.parse(mapping);
    } catch {
      throw new BadRequestException('El mapeo de columnas es invalido');
    }
  }
}
