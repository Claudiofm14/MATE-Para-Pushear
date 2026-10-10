import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indices para las columnas de relacion (FK) que se filtran constantemente
 * en dashboard, busqueda y gestion de comisiones/materias. Postgres no crea
 * indice automatico en el lado "many" de una FK: sin esto, cada
 * `where alumnoId = ...` / `In(materiaIds)` hace sequential scan.
 */
export class AddPerformanceIndexes1779548265156 implements MigrationInterface {
  name = 'AddPerformanceIndexes1779548265156';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_alumnoId" ON "alumno_materia" ("alumnoId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_comisionId" ON "alumno_materia" ("comisionId")`,
    );
    // Cubre tanto "where materiaId = X" como "where materiaId = X and estado = Y",
    // que es el patron mas repetido (inscripciones aprobadas/pendientes por materia).
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alumno_materia_materiaId_estado" ON "alumno_materia" ("materiaId", "estado")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_profesor_materia_profesorId" ON "profesor_materia" ("profesorId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_profesor_materia_materiaId" ON "profesor_materia" ("materiaId")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_usuario_githubUser" ON "usuario" ("githubUser")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_usuario_rol" ON "usuario" ("rol")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_material_academico_materiaId" ON "material_academico" ("materiaId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_material_academico_materiaId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuario_rol"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuario_githubUser"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profesor_materia_materiaId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_profesor_materia_profesorId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_materiaId_estado"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_comisionId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_alumno_materia_alumnoId"`,
    );
  }
}
