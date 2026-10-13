import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Inicio } from './inicio.entity';
import { ContratoPedagogico } from './contrato_pedagogico.entity';
import { Material } from './material.entity';
import { Cursada } from './cursada.entity';
import { Video } from './video.entity';
import { MaterialAcademico } from './material-academico.entity';
import { MateriaLog } from './materia-log.entity';

export const DEFAULT_MATERIA_CONFIG = {
  tabs: {
    inicio: true,
    material: true,
    videos: true,
    semanas: true,
    avance: true,
    cronograma: true,
    misAlumnos: true,
    planilla: true,
    contratoPedagogico: true,
    logs: true,
    configuracion: true,
  },
  pages: {
    inicio: {
      titulo: '',
      descripcion: '',
    },
    material: {
      titulo: 'Material Académico',
      descripcion: 'Recursos y contenidos para acompañar la cursada.',
    },
    videos: {
      titulo: 'Videos',
      descripcion:
        'Videotutoriales y guías paso a paso para complementar tu aprendizaje.',
    },
    semanas: {
      titulo: 'Semanas',
      descripcion: 'Gestiona las semanas de la cursada',
    },
    cronograma: {
      titulo: 'Cronograma',
      descripcion: 'Clases y actividades de la cursada.',
    },
    avance: {
      titulo: 'Avance de Cursada',
      descripcion:
        'Visualizá el mapa de la materia. Las actividades y trabajos prácticos se irán habilitando a medida que completes cada entrega.',
    },
    misAlumnos: {
      titulo: 'Mis Alumnos',
      descripcion: 'Solicitudes, comisiones y estudiantes de la materia.',
    },
    planilla: {
      titulo: 'Planilla de Seguimiento',
      descripcion: 'Actividades y entregas de la cursada.',
    },
    contratoPedagogico: {
      titulo: 'Contrato Pedagógico',
      descripcion:
        'Documentos y acuerdos relacionados con el contrato pedagógico.',
    },
  },
};

@Entity('materia')
export class Materia extends ConFecha {
  @ApiProperty({
    description: 'ID único de la materia',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Nombre de la materia',
    example: 'Programación con Objetos 2',
  })
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ApiProperty({
    description: 'Código único de la materia',
    example: 'POO2-2024',
    required: false,
  })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  codigo: string;

  @Column({ type: 'jsonb', default: DEFAULT_MATERIA_CONFIG })
  configuracion: Record<string, any>;

  @ApiProperty({
    description:
      'Materia archivada: conserva todo su contenido pero queda fuera de circulacion',
    example: false,
  })
  @Index()
  @Column({ type: 'boolean', default: false })
  archivada: boolean;

  @ApiProperty({
    description: 'Fecha en que la materia fue archivada',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  archivadaEn: Date | null;

  @ApiProperty({
    description: 'Email del admin que archivo la materia',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  archivadaPor: string | null;

  @OneToMany(() => Inicio, (inicio) => inicio.materia)
  inicios: Inicio[];

  @OneToMany(() => ContratoPedagogico, (contrato) => contrato.materia)
  contratos: ContratoPedagogico[];

  @OneToMany(() => Material, (material) => material.materia)
  materiales: Material[];

  @OneToMany(() => Cursada, (cursada) => cursada.materia)
  cursadas: Cursada[];

  @OneToMany(() => Video, (video) => video.materia)
  videos: Video[];

  @OneToMany(() => MaterialAcademico, (material) => material.materia)
  materialesAcademicos: MaterialAcademico[];

  @OneToMany(() => MateriaLog, (log) => log.materia)
  logs: MateriaLog[];
}
