import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Materia } from './materia.entity';

@Entity('material_academico')
export class MaterialAcademico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // Tipo de contenido (texto, link, archivo, video, etc.) - completamente flexible
  @Column({ nullable: true })
  tipo: string;

  // Categoría personalizable (puede ser cualquier string)
  @Column({ nullable: true })
  categoria: string;

  // URL si es un enlace externo
  @Column({ type: 'text', nullable: true })
  url: string;

  // Texto del botón/enlace
  @Column({ nullable: true })
  textoBoton: string;

  // Contenido rico en formato JSON (puede ser cualquier estructura)
  // Ejemplos: lista de comandos, pasos, items, etc.
  @Column({ type: 'json', nullable: true })
  contenido: any;

  // Icono para mostrar (nombre de lucide-react o emoji)
  @Column({ nullable: true })
  icono: string;

  // Color para la categoría (hex o nombre de color de tailwind)
  @Column({ nullable: true })
  color: string;

  @Column({ default: 0 })
  orden: number;

  @Column({ default: true })
  visible: boolean;

  @ManyToOne(() => Materia, (materia) => materia.materialesAcademicos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  materia: Materia;

  @Index()
  @Column()
  materiaId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
