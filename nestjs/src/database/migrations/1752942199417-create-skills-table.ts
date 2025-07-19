import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateSkillsTable1752942199417 implements MigrationInterface {
  private readonly tableName = 'skills'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            );
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName};`)
  }
}
