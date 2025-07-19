export class UnifiedJobDto {
  title: string
  location: string
  type?: string // Not always present in provider2
  salaryRange?: string // Not always present in provider2
  postedDate: Date
  company: { name: string; industry?: string; website?: string }
  skills: string[]
  provider: string
  providerJobId: string
}
