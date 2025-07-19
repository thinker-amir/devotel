import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateJobSkillsTable1752942220700 implements MigrationInterface {
  private readonly tableName = 'job_skills'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE ${this.tableName} (
                job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
                skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
                PRIMARY KEY (job_id, skill_id)
            );
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ${this.tableName};`)
  }
}
