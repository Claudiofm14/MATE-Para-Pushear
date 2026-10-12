import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExerciseCreatedBy1779548265161 implements MigrationInterface {
  name = 'AddExerciseCreatedBy1779548265161';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD "createdById" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" ADD CONSTRAINT "FK_ejercicio_created_by" FOREIGN KEY ("createdById") REFERENCES "usuario"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ejercicio_created_by" ON "ejercicio" ("createdById")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ejercicio_created_by"`);
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP CONSTRAINT "FK_ejercicio_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicio" DROP COLUMN "createdById"`,
    );
  }
}
