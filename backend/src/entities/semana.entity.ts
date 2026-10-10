import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Cursada } from './cursada.entity';
import { Comision } from './comision.entity';
import { Video } from './video.entity';
import { Ejercicio } from './ejercicio.entity';
import { Horario } from './horario.entity';

@Entity()
export class Semana extends ConFecha {
  @ApiProperty({
    description: 'ID único de la semana',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Título de la semana',
    example: 'Semana 1 - Introducción',
  })
  @Column({ length: 100 })
  titulo: string;

  @ApiProperty({
    description: 'Descripción de la semana',
    example:
      'En esta semana veremos los conceptos básicos de programación orientada a objetos',
  })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({
    description: 'Número de semana',
    example: 1,
  })
  @Column({ type: 'int' })
  numeroSemana: number;

  @ApiProperty({
    description: 'Fecha de inicio de la semana',
    example: '2024-03-20',
  })
  @Column({ type: 'date' })
  fechaInicio: Date;

  @ApiProperty({
    description:
      'Hora argentina de inicio de publicación de la semana (formato HH:mm)',
    example: '08:00',
  })
  @Column({ type: 'time', default: '00:00' })
  horaInicio: string;

  @ApiProperty({
    description: 'Fecha de clase por comision en formato YYYY-MM-DD',
    required: false,
    example: { '1': '2026-06-11', '2': '2026-06-12' },
  })
  @Column({ type: 'json', nullable: true })
  fechasClasePorComision: Record<string, string>;

  @ApiProperty({
    description: 'Información importante de la semana',
    example: 'Recordar traer notebook para la clase práctica',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  importante: string;

  @ApiProperty({
    description: 'Avisos de la semana',
    example: 'La clase del miércoles será virtual',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  avisos: string;

  @ApiProperty({
    description: 'Contenido rico en formato de bloques',
    required: false,
    example: {
      blocks: [
        {
          id: '123',
          type: 'text',
          data: {
            titulo: 'Introducción',
            contenido: 'Contenido de la semana...',
          },
        },
      ],
    },
  })
  @Column({ type: 'json', nullable: true })
  contenido: any;

  @ManyToOne(() => Cursada, (cursada) => cursada.semanas, {
    onDelete: 'CASCADE',
  })
  cursada: Cursada;

  @Column({ nullable: true })
  cursadaId: number;

  @ManyToMany(() => Comision, (comision) => comision.semanas)
  @JoinTable({
    name: 'semana_comision',
    joinColumn: { name: 'semana_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'comision_id', referencedColumnName: 'id' },
  })
  comisiones: Comision[];

  @OneToMany(() => Video, (video) => video.semana, {
    cascade: true,
  })
  videos: Video[];

  @OneToMany(() => Ejercicio, (ejercicio) => ejercicio.semana, {
    cascade: true,
  })
  ejercicios: Ejercicio[];

  @OneToMany(() => Horario, (horario) => horario.semana, {
    cascade: true,
  })
  horarios: Horario[];
}
