import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerService } from '../../logger/services/logger.service'
import { LogLevel } from '../../logger/enums/LogLevel.enum'
import { PROVIDER_1_JOBS_API } from '../constants'
import { UnifiedJobDto } from '../dto/unified-job.dto'
import { JobProvider } from '../interfaces/job-provider.interface'

@Injectable()
export class Provider1Service implements JobProvider {
  private apiUrl: string
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setSource('JobModule', 'Provider1Service')
    this.loadApiUrl()
  }

  loadApiUrl() {
    const url = this.configService.get<string>(PROVIDER_1_JOBS_API)
    if (!url) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_1_JOBS_API}`,
      })
      throw new Error(`Missing required configuration: ${PROVIDER_1_JOBS_API}`)
    } else {
      this.apiUrl = url
      this.loggerService.create({
        level: LogLevel.INFO,
        message: `Provider1 API URL loaded: ${url}`,
      })
    }
  }

  async fetchJobs(): Promise<UnifiedJobDto[]> {
    try {
      this.loggerService.create({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider1',
      })

      const { data } = await this.httpService.axiosRef.get(this.apiUrl)
      const jobs = data.jobs.map((job) => ({
        title: job.title,
        location: job.details.location,
        type: job.details.type,
        salaryRange: job.details.salaryRange,
        postedDate: new Date(job.postedDate),
        company: job.company,
        skills: job.skills,
        provider: 'provider1',
        providerJobId: job.jobId,
      }))

      this.loggerService.create({
        level: LogLevel.INFO,
        message: `Successfully fetched ${jobs.length} jobs from Provider1`,
      })

      return jobs
    } catch (error) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Failed to fetch jobs from Provider1: ${error.message}`,
      })
      throw error
    }
  }
}
