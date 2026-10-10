import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSemanaFechasClasePorComision1779548265142 implements MigrationInterface {
  name = 'AddSemanaFechasClasePorComision1779548265142';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "semana" ADD "fechasClasePorComision" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "semana" DROP COLUMN "fechasClasePorComision"`,
    );
  }
}
