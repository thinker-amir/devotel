import { UnifiedJobDto } from '../dto/unified-job.dto'

export interface JobProvider {
  fetchJobs(): Promise<UnifiedJobDto[]>
  loadApiUrl(): void
}
