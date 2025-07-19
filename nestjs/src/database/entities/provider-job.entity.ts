import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Job } from './job.entity'

@Entity('provider_jobs')
@Unique(['provider', 'providerJobId'])
export class ProviderJob {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  provider: string // e.g., 'provider1', 'provider2'

  @Column({ name: 'provider_job_id' })
  providerJobId: string

  @ManyToOne(() => Job, (job) => job.providerJobs)
  @JoinColumn({ name: 'job_id' })
  job: Job
}
