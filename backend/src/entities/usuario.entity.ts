import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConFecha } from './conFecha.abstract.entity';
import { AlumnoMateria } from './alumno-materia.entity';
import { ProfesorMateria } from './profesor-materia.entity';

@Entity('usuario')
export class Usuario extends ConFecha {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID del usuario en el proveedor de autenticación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  authProviderId: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@unahur.edu.ar',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({
    description: 'Nombre de usuario del proveedor Git/Gitea',
    example: 'juanperez',
    required: false,
  })
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  githubUser: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  // El legajo/DNI es un dato administrativo: se persiste para identificar al
  // alumno, pero no se incluye en consultas ni respuestas por defecto.
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  legajo: string | null;

  @ApiProperty({
    description: 'Rol del usuario en la plataforma',
    example: 'alumno',
    enum: ['alumno', 'docente', 'admin'],
  })
  @Index()
  @Column({ type: 'enum', enum: ['alumno', 'docente', 'admin'] })
  rol: string;

  @ApiProperty({
    description: 'Indica si el usuario puede acceder a la plataforma',
    example: true,
  })
  @Column({ default: true })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha en la que el usuario fue suspendido',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  suspendidoAt: Date;

  @ApiProperty({
    description: 'ID del administrador que suspendio al usuario',
    required: false,
  })
  @Column({ nullable: true })
  suspendidoPorId: number;

  @ApiProperty({
    description: 'Motivo administrativo de la suspension',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  suspensionMotivo: string;

  @ApiProperty({
    description: 'Ultima actividad autenticada del usuario en la plataforma',
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  ultimoAccesoAt: Date;

  @OneToMany(() => AlumnoMateria, (alumnoMateria) => alumnoMateria.alumno, {
    cascade: true,
  })
  materiasAlumno: AlumnoMateria[];

  @OneToMany(
    () => ProfesorMateria,
    (profesorMateria) => profesorMateria.profesor,
    {
      cascade: true,
    },
  )
  materiasProfesor: ProfesorMateria[];
}
