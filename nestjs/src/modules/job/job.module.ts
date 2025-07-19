import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { Provider1Service } from './services/provider1.service'
import { Provider2Service } from './services/provider2.service'
import { JobService } from './services/job/job.service'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Company } from 'src/database/entities/company.entity'
import { Job } from 'src/database/entities/job.entity'
import { ProviderJob } from 'src/database/entities/provider-job.entity'
import { Skill } from 'src/database/entities/skill.entity'
import { JobSchedulerService } from './services/job-scheduler/job-scheduler.service'
import { LoggerService } from '../logger/services/logger.service'

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Job, Company, Skill, ProviderJob])],
  providers: [
    Provider1Service,
    Provider2Service,
    {
      provide: JobService,
      useFactory: (jobRepo, companyRepo, skillRepo, providerJobRepo, providers, loggerService) =>
        new JobService(jobRepo, companyRepo, skillRepo, providerJobRepo, providers, loggerService),
      inject: [
        getRepositoryToken(Job),
        getRepositoryToken(Company),
        getRepositoryToken(Skill),
        getRepositoryToken(ProviderJob),
        'JOB_PROVIDERS',
        LoggerService,
      ],
    },
    {
      provide: 'JOB_PROVIDERS',
      useFactory: (p1, p2) => [p1, p2],
      inject: [Provider1Service, Provider2Service],
    },
    JobSchedulerService,
  ],
})
export class JobModule {}
