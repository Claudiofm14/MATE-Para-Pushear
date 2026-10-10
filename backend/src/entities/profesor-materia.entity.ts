import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { Usuario } from './usuario.entity';
import { Materia } from './materia.entity';
import { ProfesorComision } from './profesor-comision.entity';

@Entity('profesor_materia')
export class ProfesorMateria extends ConFecha {
  @ApiProperty({
    description: 'ID único de la relación profesor-materia',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Usuario profesor',
    type: () => Usuario,
  })
  @ManyToOne(() => Usuario, (usuario) => usuario.materiasProfesor, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profesorId' })
  profesor: Usuario;

  @Index()
  @Column()
  profesorId: number;

  @ApiProperty({
    description: 'Materia asignada al profesor',
    type: () => Materia,
  })
  @ManyToOne(() => Materia, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'materiaId' })
  materia: Materia;

  @Index()
  @Column()
  materiaId: number;

  @ApiProperty({
    description: 'Comisiones del profesor en esta materia',
    type: () => [ProfesorComision],
  })
  @OneToMany(
    () => ProfesorComision,
    (profesorComision) => profesorComision.profesorMateria,
    {
      cascade: true,
    },
  )
  comisiones: ProfesorComision[];
}
