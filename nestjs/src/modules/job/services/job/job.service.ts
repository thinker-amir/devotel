import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Company } from 'src/database/entities/company.entity'
import { Job } from 'src/database/entities/job.entity'
import { ProviderJob } from 'src/database/entities/provider-job.entity'
import { Skill } from 'src/database/entities/skill.entity'
import { Repository } from 'typeorm'
import { UnifiedJobDto } from '../../dto/unified-job.dto'
import { JobProvider } from '../../interfaces/job-provider.interface'

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(ProviderJob) private providerJobRepo: Repository<ProviderJob>,
    private readonly providers: JobProvider[],
  ) {}

  async fetchAndStoreJobs() {
    for (const provider of this.providers) {
      const jobs = await provider.fetchJobs()
      for (const job of jobs) {
        await this.upsertJob(job)
      }
    }
  }

  async upsertJob(jobDto: UnifiedJobDto) {
    // 1. Upsert company
    let company = await this.companyRepo.findOne({ where: { name: jobDto.company.name } })
    if (!company) {
      company = this.companyRepo.create(jobDto.company)
      await this.companyRepo.save(company)
    }

    // 2. Upsert skills
    const skills: Skill[] = []
    for (const skillName of jobDto.skills) {
      let skill = await this.skillRepo.findOne({ where: { name: skillName } })
      if (!skill) {
        skill = this.skillRepo.create({ name: skillName })
        await this.skillRepo.save(skill)
      }
      skills.push(skill)
    }

    // 3. Check for existing provider_job
    let providerJob = await this.providerJobRepo.findOne({
      where: { provider: jobDto.provider, providerJobId: jobDto.providerJobId },
      relations: ['job'],
    })

    let job: Job
    if (providerJob) {
      // Update job if needed
      job = providerJob.job
      // Optionally update job fields here if you want to sync changes
    } else {
      // 4. Create job
      job = this.jobRepo.create({
        title: jobDto.title,
        location: jobDto.location,
        type: jobDto.type,
        salaryRange: jobDto.salaryRange,
        postedDate: jobDto.postedDate,
        company,
        skills,
      })
      await this.jobRepo.save(job)

      // 5. Create provider_job
      providerJob = this.providerJobRepo.create({
        provider: jobDto.provider,
        providerJobId: jobDto.providerJobId,
        job,
      })
      await this.providerJobRepo.save(providerJob)
    }
  }
}
