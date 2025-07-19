import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { LoggerService } from '../../../logger/services/logger.service'
import { LogLevel } from '../../../logger/enums/LogLevel.enum'
import { JobService } from '../job/job.service'

@Injectable()
export class JobSchedulerService {
  constructor(
    private readonly jobService: JobService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setSource('JobModule', 'JobSchedulerService')
  }

  @Cron(process.env.JOB_FETCH_CRON_PATTERN || CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    try {
      this.loggerService.create({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })

      await this.jobService.fetchAndStoreJobs()

      this.loggerService.create({
        level: LogLevel.INFO,
        message: 'Scheduled job fetch completed successfully',
      })
    } catch (error) {
      this.loggerService.create({
        level: LogLevel.ERROR,
        message: `Scheduled job fetch failed: ${error.message}`,
      })
      throw error
    }
  }
}
