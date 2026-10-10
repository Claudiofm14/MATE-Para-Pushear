import { ApiPropertyOptional } from '@nestjs/swagger';
import { MateriaLogAction } from '../../../entities/materia-log.entity';

export class CreateMateriaLogDto {
  materiaId: number;
  usuarioId?: number;
  actorNombre?: string;
  actorEmail?: string;
  action: MateriaLogAction;
  resourceType: string;
  resourceId?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, any>;
  result?: string;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export class ListMateriaLogQueryDto {
  @ApiPropertyOptional({ description: 'Tipo de recurso a filtrar' })
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Accion a filtrar' })
  action?: MateriaLogAction;
}
