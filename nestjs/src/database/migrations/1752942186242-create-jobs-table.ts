import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateJobsTable1752942186242 implements MigrationInterface {
  private readonly tableName = 'jobs'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                location TEXT,
                type TEXT,
                salary_range TEXT,
                posted_date TIMESTAMP,
                company_id INT REFERENCES companies(id)
            );
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName};`)
  }
}
