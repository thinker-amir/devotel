import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Job } from './job.entity'

@Entity('provider_jobs')
@Unique(['provider', 'providerJobId'])
export class ProviderJob {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  provider: string // e.g., 'provider1', 'provider2'

  @Column()
  providerJobId: string

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @ManyToOne(() => Job, (job) => job.providerJobs)
  @JoinColumn({ name: 'job_id' })
  job: Job
}
