import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Semana } from './semana.entity';
import { Materia } from './materia.entity';

@Entity()
export class Video extends ConFecha {
  @ApiProperty({
    description: 'ID único del video',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título del video',
    example: 'Introducción a POO - Parte 1',
  })
  @Column({ length: 100 })
  titulo: string;

  @ApiProperty({
    description: 'URL del video de YouTube',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @Column({ type: 'text' })
  url: string;

  @ApiProperty({
    description: 'Subtítulo o descripción breve del video',
    example: 'Conceptos básicos de clases y objetos',
    required: false,
  })
  @Column({ length: 255, nullable: true })
  subtitulo: string;

  @ApiProperty({
    description: 'Orden de visualización',
    example: 1,
    default: 0,
  })
  @Column({ default: 0 })
  orden: number;

  @ManyToOne(() => Semana, (semana) => semana.videos, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  semana: Semana;

  @ManyToOne(() => Materia, (materia) => materia.videos, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  materia: Materia;
}
