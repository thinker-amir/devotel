import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerService } from '../../logger/services/logger.service'
import { LogLevel } from '../../logger/enums/LogLevel.enum'
import { UnifiedJobDto } from '../dto/unified-job.dto'
import { JobProvider } from '../interfaces/job-provider.interface'
import { PROVIDER_2_JOBS_API } from '../constants'

@Injectable()
export class Provider2Service implements JobProvider {
  private apiUrl: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setSource('JobModule', 'Provider2Service')
    this.loadApiUrl()
  }

  loadApiUrl() {
    const url = this.configService.get<string>(PROVIDER_2_JOBS_API)
    if (!url) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_2_JOBS_API}`,
      })
      throw new Error(`Missing required configuration: ${PROVIDER_2_JOBS_API}`)
    } else {
      this.apiUrl = url
      this.loggerService.create({
        level: LogLevel.INFO,
        message: `Provider2 API URL loaded: ${url}`,
      })
    }
  }

  async fetchJobs(): Promise<UnifiedJobDto[]> {
    try {
      this.loggerService.create({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider2',
      })

      const { data } = await this.httpService.axiosRef.get(this.apiUrl)
      const jobsList = data.data.jobsList
      const jobs = Object.entries(jobsList).map(([jobId, job]: [string, any]) => {
        return {
          title: job.position,
          location: `${job.location.city}, ${job.location.state}${job.location.remote ? ' (Remote)' : ''}`,
          type: job.location.remote ? 'Remote' : 'Onsite',
          salaryRange: job.compensation
            ? `${job.compensation.currency} ${job.compensation.min} - ${job.compensation.max}`
            : undefined,
          postedDate: new Date(job.datePosted),
          company: {
            name: job.employer.companyName,
            website: job.employer.website,
          },
          skills: job.requirements.technologies,
          provider: 'provider2',
          providerJobId: jobId,
        }
      })

      this.loggerService.create({
        level: LogLevel.INFO,
        message: `Successfully fetched ${jobs.length} jobs from Provider2`,
      })

      return jobs
    } catch (error) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Failed to fetch jobs from Provider2: ${error.message}`,
      })
      throw error
    }
  }
}
