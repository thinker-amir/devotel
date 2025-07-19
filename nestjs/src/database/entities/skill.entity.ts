import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'
import { Job } from './job.entity'

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  name: string

  @ManyToMany(() => Job, (job) => job.skills)
  jobs: Job[]
}
