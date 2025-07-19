import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Company } from 'src/database/entities/company.entity'
import { Job } from 'src/database/entities/job.entity'
import { ProviderJob } from 'src/database/entities/provider-job.entity'
import { Skill } from 'src/database/entities/skill.entity'
import { Repository } from 'typeorm'
import { LoggerService } from '../../../logger/services/logger.service'
import { LogLevel } from '../../../logger/enums/LogLevel.enum'
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
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setSource('JobModule', 'JobService')
  }

  async fetchAndStoreJobs() {
    this.loggerService.create({
      level: LogLevel.INFO,
      message: `Starting job fetch and store process with ${this.providers.length} providers`,
    })

    for (const provider of this.providers) {
      try {
        const jobs = await provider.fetchJobs()
        this.loggerService.create({
          level: LogLevel.INFO,
          message: `Processing ${jobs.length} jobs from provider`,
        })

        for (const job of jobs) {
          await this.upsertJob(job)
        }
      } catch (error) {
        this.loggerService.create({
          level: LogLevel.ERROR,
          message: `Failed to process jobs from provider: ${error.message}`,
        })
        throw error
      }
    }

    this.loggerService.create({
      level: LogLevel.INFO,
      message: 'Job fetch and store process completed',
    })
  }

  async upsertJob(jobDto: UnifiedJobDto) {
    try {
      // 1. Upsert company
      let company = await this.companyRepo.findOne({ where: { name: jobDto.company.name } })
      if (!company) {
        company = this.companyRepo.create(jobDto.company)
        await this.companyRepo.save(company)
        this.loggerService.create({
          level: LogLevel.INFO,
          message: `Created new company: ${jobDto.company.name}`,
        })
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
        this.loggerService.create({
          level: LogLevel.DEBUG,
          message: `Job already exists: ${jobDto.title} (${jobDto.providerJobId})`,
        })
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

        this.loggerService.create({
          level: LogLevel.INFO,
          message: `Created new job: ${jobDto.title} from ${jobDto.provider}`,
        })
      }
    } catch (error) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Failed to upsert job ${jobDto.title}: ${error.message}`,
      })
      throw error
    }
  }
}
