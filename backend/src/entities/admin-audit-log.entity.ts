import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConFecha } from './conFecha.abstract.entity';
import { Usuario } from './usuario.entity';

export enum AdminAuditAction {
  USER_ROLE_UPDATED = 'user_role_updated',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
  USER_DELETED = 'user_deleted',
  USER_TEACHER_ASSIGNED = 'user_teacher_assigned',
  USER_TEACHER_REMOVED = 'user_teacher_removed',
  MATERIA_CREATED = 'materia_created',
  MATERIA_UPDATED = 'materia_updated',
  MATERIA_DELETED = 'materia_deleted',
  MATERIA_RESTORED = 'materia_restored',
  MATERIA_ARCHIVED = 'materia_archived',
  MATERIA_UNARCHIVED = 'materia_unarchived',
  STUDENT_ENROLLMENT_UPDATED = 'student_enrollment_updated',
  DELIVERY_UPDATED = 'delivery_updated',
  GITEA_IMPORT_EXECUTED = 'gitea_import_executed',
  GITEA_PASSWORD_UPDATED = 'gitea_password_updated',
  STUDENT_LIST_EXPORTED = 'student_list_exported',
  MAINTENANCE_UPDATED = 'maintenance_updated',
}

@Entity('admin_audit_log')
export class AdminAuditLog extends ConFecha {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ nullable: true })
  actorId: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor: Usuario;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorEmail: string;

  @Index()
  @Column({ nullable: true })
  targetUserId: number;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: Usuario;

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetEmail: string;

  @Column({ type: 'enum', enum: AdminAuditAction })
  action: AdminAuditAction;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  detail: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'varchar', length: 64, default: 'success' })
  result: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  correlationId: string;
}
