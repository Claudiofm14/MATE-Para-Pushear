import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Usuario } from './usuario.entity';
import { MensajeSoporte } from './mensaje-soporte.entity';

export enum ReporteSoporteCategoria {
  BUG = 'bug',
  FUNCIONALIDAD = 'funcionalidad',
  ESTETICO = 'estetico',
  OTRO = 'otro',
}

export enum ReporteSoporteEstado {
  ABIERTO = 'abierto',
  CERRADO = 'cerrado',
}

/**
 * Hilo de soporte entre un usuario y los administradores.
 *
 * Un usuario tiene como maximo un hilo abierto a la vez (garantizado con un
 * indice unico parcial). Cuando un admin lo cierra deja de estar disponible
 * para el usuario, que recien entonces puede abrir uno nuevo.
 */
@Entity('reporte_soporte')
export class ReporteSoporte extends ConFecha {
  @ApiProperty({ description: 'ID unico del reporte', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  usuarioId: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @ApiProperty({
    description: 'Tipo de reporte',
    enum: ReporteSoporteCategoria,
    example: ReporteSoporteCategoria.BUG,
  })
  @Column({ type: 'enum', enum: ReporteSoporteCategoria })
  categoria: ReporteSoporteCategoria;

  @ApiProperty({
    description: 'Resumen corto escrito por el usuario',
    example: 'No carga el video de la semana 3',
  })
  @Column({ type: 'varchar', length: 140 })
  asunto: string;

  @ApiProperty({ enum: ReporteSoporteEstado })
  @Index()
  @Column({
    type: 'enum',
    enum: ReporteSoporteEstado,
    default: ReporteSoporteEstado.ABIERTO,
  })
  estado: ReporteSoporteEstado;

  @ApiProperty({
    description: 'Ruta desde la que se abrio el reporte',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paginaOrigen: string | null;

  @ApiProperty({
    description: 'Navegador del usuario, para poder reproducir el problema',
    required: false,
  })
  @Column({ type: 'varchar', length: 400, nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Fecha del ultimo mensaje del hilo' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  ultimoMensajeEn: Date;

  @Column({ type: 'timestamp', nullable: true })
  ultimaLecturaUsuario: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ultimaLecturaAdmin: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cerradoEn: Date | null;

  @Column({ nullable: true })
  cerradoPorId: number | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cerradoPorId' })
  cerradoPor: Usuario | null;

  @OneToMany(() => MensajeSoporte, (mensaje) => mensaje.reporte)
  mensajes: MensajeSoporte[];
}
