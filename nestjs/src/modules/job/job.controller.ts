// src/jobs/jobs.controller.ts
import { Crud } from '@dataui/crud'
import { Controller } from '@nestjs/common'
import { Job } from 'src/database/entities/job.entity'
import { JobService } from './services/job.service'

@Crud({
  model: {
    type: Job,
  },
  query: {
    maxLimit: 15,
    join: {
      company: { eager: true },
      skills: { eager: true },
    },
    alwaysPaginate: true,
  },
  routes: {
    only: ['getManyBase'],
  },
})
@Controller('api/job-offers')
export class JobController {
  constructor(public service: JobService) {}
}
