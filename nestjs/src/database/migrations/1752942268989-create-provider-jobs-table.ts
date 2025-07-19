import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateProviderJobsTable1752942268989 implements MigrationInterface {
  private readonly tableName = 'provider_jobs'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                id SERIAL PRIMARY KEY,
                provider TEXT NOT NULL,
                provider_job_id TEXT NOT NULL,
                job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
                UNIQUE (provider, provider_job_id)
            );
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName};`)
  }
}
