import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm'
import { Company } from './company.entity'
import { ProviderJob } from './provider-job.entity'
import { Skill } from './skill.entity'

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column({ nullable: true })
  location: string

  @Column({ nullable: true })
  type: string

  @Column({ name: 'salary_range', nullable: true })
  salaryRange: string

  @Column({ name: 'posted_date', type: 'timestamp', nullable: true })
  postedDate: Date

  @ManyToOne(() => Company, (company) => company.jobs)
  @JoinColumn({ name: 'company_id' })
  company: Company

  @ManyToMany(() => Skill, (skill) => skill.jobs, { cascade: true })
  @JoinTable({
    name: 'job_skills',
    joinColumn: { name: 'job_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills: Skill[]

  @OneToMany(() => ProviderJob, (providerJob) => providerJob.job)
  providerJobs: ProviderJob[]
}
