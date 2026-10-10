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
import { ReporteSoporte } from './reporte-soporte.entity';
import { AdjuntoSoporte } from './adjunto-soporte.entity';

/** Mensaje dentro de un hilo de soporte, escrito por el usuario o por un admin. */
@Entity('mensaje_soporte')
export class MensajeSoporte extends ConFecha {
  @ApiProperty({ description: 'ID unico del mensaje', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  reporteId: number;

  @ManyToOne(() => ReporteSoporte, (reporte) => reporte.mensajes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporteId' })
  reporte: ReporteSoporte;

  @Column({ nullable: true })
  autorId: number | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'autorId' })
  autor: Usuario | null;

  @ApiProperty({
    description: 'Nombre del autor al momento de escribir el mensaje',
    example: 'Valentino Chiappanni',
  })
  @Column({ type: 'varchar', length: 160 })
  autorNombre: string;

  @ApiProperty({
    description: 'Indica si el mensaje lo escribio un administrador',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  esAdmin: boolean;

  @ApiProperty({ description: 'Texto del mensaje' })
  @Column({ type: 'text' })
  cuerpo: string;

  @OneToMany(() => AdjuntoSoporte, (adjunto) => adjunto.mensaje)
  adjuntos: AdjuntoSoporte[];
}
