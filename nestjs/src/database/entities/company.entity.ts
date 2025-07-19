import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Job } from './job.entity'

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true })
  industry: string

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[]
}
