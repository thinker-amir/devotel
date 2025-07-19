import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PROVIDER_1_JOBS_API } from '../constants'
import { UnifiedJobDto } from '../dto/unified-job.dto'
import { JobProvider } from '../interfaces/job-provider.interface'

@Injectable()
export class Provider1Service implements JobProvider {
  private apiUrl: string
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.loadApiUrl()
  }

  loadApiUrl() {
    const url = this.configService.get<string>(PROVIDER_1_JOBS_API)
    if (!url) {
      throw new Error(`Missing required configuration: ${PROVIDER_1_JOBS_API}`)
    } else {
      this.apiUrl = url
    }
  }

  async fetchJobs(): Promise<UnifiedJobDto[]> {
    const { data } = await this.httpService.axiosRef.get(this.apiUrl)

    return data.jobs.map((job) => ({
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
  }
}
