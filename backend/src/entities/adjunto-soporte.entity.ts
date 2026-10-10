import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MensajeSoporte } from './mensaje-soporte.entity';

/**
 * Captura de pantalla adjunta a un mensaje de soporte.
 *
 * El binario vive en la propia tabla: son pocas imagenes y de pocos MB, y de
 * esta forma entran en el backup de la base sin montar almacenamiento aparte.
 * `select: false` evita traer el contenido en los listados.
 */
@Entity('adjunto_soporte')
export class AdjuntoSoporte {
  @ApiProperty({ description: 'ID unico del adjunto', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  mensajeId: number;

  @ManyToOne(() => MensajeSoporte, (mensaje) => mensaje.adjuntos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mensajeId' })
  mensaje: MensajeSoporte;

  @ApiProperty({ description: 'Nombre original del archivo' })
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ApiProperty({ description: 'Tipo de imagen', example: 'image/png' })
  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @ApiProperty({ description: 'Tamano en bytes', example: 128400 })
  @Column({ type: 'int' })
  tamanio: number;

  @Column({ type: 'bytea', select: false })
  contenido: Buffer;

  @CreateDateColumn()
  createdAt: Date;
}
