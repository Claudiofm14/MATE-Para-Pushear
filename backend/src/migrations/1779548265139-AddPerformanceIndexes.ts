import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1779548265139 implements MigrationInterface {
  name = 'AddPerformanceIndexes1779548265139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_materia_estado" ON "alumno_materia" ("materiaId", "estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_alumno_materia_estado" ON "alumno_materia" ("alumnoId", "materiaId", "estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_comision_estado" ON "alumno_materia" ("comisionId", "estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_fecha" ON "alumno_materia" ("fechaInscripcion")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entrega_actividad_actividad_alumno" ON "entrega_actividad" ("actividadId", "alumnoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_entrega_actividad_alumno" ON "entrega_actividad" ("alumnoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_actividad_materia_activo" ON "actividad" ("materiaId", "activo")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cursada_materia_activa" ON "cursada" ("materiaId", "activa")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cursada_fecha_fin" ON "cursada" ("fechaFin")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comision_cursada" ON "comision" ("cursadaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_semana_cursada_publicacion" ON "semana" ("cursadaId", "fechaInicio", "horaInicio")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_video_semana" ON "video" ("semanaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_video_materia" ON "video" ("materiaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ejercicio_semana" ON "ejercicio" ("semanaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_horario_semana" ON "horario" ("semanaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_material_materia" ON "material" ("materiaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_material_academico_materia_visible_orden" ON "material_academico" ("materiaId", "visible", "categoria", "orden")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inicio_materia" ON "inicio" ("materiaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_profesor_materia_profesor_materia" ON "profesor_materia" ("profesorId", "materiaId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_profesor_comision_comision" ON "profesor_comision" ("comisionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_solicitud_acceso_estado_created" ON "solicitud_acceso_materia" ("estado", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_solicitud_acceso_estado_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profesor_comision_comision"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profesor_materia_profesor_materia"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inicio_materia"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_material_academico_materia_visible_orden"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_material_materia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_horario_semana"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ejercicio_semana"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_video_materia"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_video_semana"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_semana_cursada_publicacion"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_comision_cursada"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cursada_fecha_fin"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_cursada_materia_activa"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_actividad_materia_activo"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_entrega_actividad_alumno"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_entrega_actividad_actividad_alumno"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alumno_materia_fecha"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_comision_estado"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_alumno_materia_estado"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_materia_estado"`,
    );
  }
}
