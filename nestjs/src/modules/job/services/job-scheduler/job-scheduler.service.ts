import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { JobService } from '../job/job.service'

@Injectable()
export class JobSchedulerService {
  constructor(private readonly jobService: JobService) {}

  @Cron(process.env.JOB_FETCH_CRON_PATTERN || CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    await this.jobService.fetchAndStoreJobs()
  }
}
