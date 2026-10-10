import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Semana } from './semana.entity';

export enum TipoHorario {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
}

@Entity()
export class Horario extends ConFecha {
  @ApiProperty({
    description: 'ID único del horario',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título del horario',
    example: 'Clase Teórica',
  })
  @Column({ length: 100 })
  titulo: string;

  @ApiProperty({
    description: 'Tipo de clase',
    example: 'presencial',
    enum: TipoHorario,
  })
  @Column({
    type: 'enum',
    enum: TipoHorario,
    default: TipoHorario.PRESENCIAL,
  })
  tipo: TipoHorario;

  @ApiProperty({
    description: 'Detalle del horario',
    example: 'Lunes 18:00 a 20:00 - Aula 305',
  })
  @Column({ type: 'text' })
  detalle: string;

  @ApiProperty({
    description: 'URL para clases virtuales',
    example: 'https://meet.google.com/abc-defg-hij',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  url: string | null;

  @ApiProperty({
    description: 'Orden de visualización dentro de la semana',
    example: 1,
    default: 0,
  })
  @Column({ default: 0 })
  orden: number;

  @ManyToOne(() => Semana, (semana) => semana.horarios, {
    onDelete: 'CASCADE',
  })
  semana: Semana;
}
