import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateCompaniesTable1752942136091 implements MigrationInterface {
  private readonly tableName = 'companies'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                industry TEXT
            );
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName} (};`)
  }
}
