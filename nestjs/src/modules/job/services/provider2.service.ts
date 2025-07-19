import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UnifiedJobDto } from '../dto/unified-job.dto'
import { JobProvider } from '../interfaces/job-provider.interface'
import { PROVIDER_2_JOBS_API } from '../constants'

@Injectable()
export class Provider2Service implements JobProvider {
  private apiUrl: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.loadApiUrl()
  }

  loadApiUrl() {
    const url = this.configService.get<string>(PROVIDER_2_JOBS_API)
    if (!url) {
      throw new Error(`Missing required configuration: ${PROVIDER_2_JOBS_API}`)
    } else {
      this.apiUrl = url
    }
  }

  async fetchJobs(): Promise<UnifiedJobDto[]> {
    const { data } = await this.httpService.axiosRef.get(this.apiUrl)
    const jobsList = data.data.jobsList
    return Object.entries(jobsList).map(([jobId, job]: [string, any]) => {
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
  }
}
