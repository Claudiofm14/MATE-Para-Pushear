import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHorarioOrden1779548265160 implements MigrationInterface {
  name = 'AddHorarioOrden1779548265160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "horario" ADD COLUMN IF NOT EXISTS "orden" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`
      WITH ordenados AS (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "semanaId" ORDER BY "id") AS posicion
        FROM "horario"
      )
      UPDATE "horario" AS horario
      SET "orden" = ordenados.posicion
      FROM ordenados
      WHERE horario."id" = ordenados."id" AND horario."orden" = 0
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_horario_semana_orden" ON "horario" ("semanaId", "orden", "id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_horario_semana_orden"`);
    await queryRunner.query(
      `ALTER TABLE "horario" DROP COLUMN IF EXISTS "orden"`,
    );
  }
}
