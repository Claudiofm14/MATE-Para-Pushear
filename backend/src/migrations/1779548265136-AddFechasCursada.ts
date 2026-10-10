import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFechasCursada1779548265136 implements MigrationInterface {
  name = 'AddFechasCursada1779548265136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cursada" ADD "fechaInicio" date`);
    await queryRunner.query(`ALTER TABLE "cursada" ADD "fechaFin" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cursada" DROP COLUMN "fechaFin"`);
    await queryRunner.query(`ALTER TABLE "cursada" DROP COLUMN "fechaInicio"`);
  }
}
