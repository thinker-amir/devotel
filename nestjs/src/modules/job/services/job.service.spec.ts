import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Company } from 'src/database/entities/company.entity'
import { Job } from 'src/database/entities/job.entity'
import { ProviderJob } from 'src/database/entities/provider-job.entity'
import { Skill } from 'src/database/entities/skill.entity'
import { LogLevel } from '../../logger/enums/LogLevel.enum'
import { LoggerService } from '../../logger/services/logger.service'
import { UnifiedJobDto } from '../dto/unified-job.dto'
import { JobProvider } from '../interfaces/job-provider.interface'
import { JobService } from './job.service'

describe('JobService', () => {
  let service: JobService
  let mockJobRepo: any
  let mockCompanyRepo: any
  let mockSkillRepo: any
  let mockProviderJobRepo: any
  let mockLoggerService: any
  let mockJobProviders: JobProvider[]

  const mockUnifiedJobDto: UnifiedJobDto = {
    title: 'Software Engineer',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salaryRange: '$120,000 - $150,000',
    postedDate: new Date('2023-01-01'),
    company: {
      name: 'Tech Corp',
      industry: 'Technology',
      website: 'https://techcorp.com',
    },
    skills: ['JavaScript', 'TypeScript', 'React'],
    provider: 'provider1',
    providerJobId: 'job-123',
  }

  const mockCompany = {
    id: 1,
    name: 'Tech Corp',
    industry: 'Technology',
    website: 'https://techcorp.com',
  }

  const mockSkill = {
    id: 1,
    name: 'JavaScript',
  }

  const mockJob = {
    id: 1,
    title: 'Software Engineer',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salaryRange: '$120,000 - $150,000',
    postedDate: new Date('2023-01-01'),
    company: mockCompany,
    skills: [mockSkill],
  }

  const mockProviderJob = {
    id: 1,
    provider: 'provider1',
    providerJobId: 'job-123',
    job: mockJob,
  }

  beforeEach(async () => {
    mockJobRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }

    mockCompanyRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }

    mockSkillRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }

    mockProviderJobRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    }

    mockLoggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    }

    mockJobProviders = [
      {
        fetchJobs: jest.fn(),
        loadApiUrl: jest.fn(),
      },
    ]

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepo,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepo,
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: mockSkillRepo,
        },
        {
          provide: getRepositoryToken(ProviderJob),
          useValue: mockProviderJobRepo,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: 'JOB_PROVIDERS',
          useValue: mockJobProviders,
        },
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
      ],
    }).compile()

    service = module.get<JobService>(JobService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should set source on construction', () => {
    expect(mockLoggerService.setSource).toHaveBeenCalledWith('JobModule', 'JobService')
  })

  describe('fetchAndStoreJobs', () => {
    it('should successfully fetch and store jobs from all providers', async () => {
      // Arrange
      const mockJobs = [mockUnifiedJobDto]
      mockJobProviders[0].fetchJobs = jest.fn().mockResolvedValue(mockJobs)
      jest.spyOn(service, 'upsertJob').mockResolvedValue(undefined)

      // Act
      await service.fetchAndStoreJobs()

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Starting job fetch and store process with ${mockJobProviders.length} providers`,
      })
      expect(mockJobProviders[0].fetchJobs).toHaveBeenCalled()
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Processing ${mockJobs.length} jobs from provider`,
      })
      expect(service.upsertJob).toHaveBeenCalledWith(mockUnifiedJobDto)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Job fetch and store process completed',
      })
    })

    it('should handle provider fetch error and throw', async () => {
      // Arrange
      const errorMessage = 'Provider fetch failed'
      mockJobProviders[0].fetchJobs = jest.fn().mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(service.fetchAndStoreJobs()).rejects.toThrow(errorMessage)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Failed to process jobs from provider: ${errorMessage}`,
      })
    })

    it('should process multiple providers successfully', async () => {
      // Arrange
      const secondProvider = {
        fetchJobs: jest.fn().mockResolvedValue([mockUnifiedJobDto]),
        loadApiUrl: jest.fn(),
      }
      mockJobProviders.push(secondProvider)
      mockJobProviders[0].fetchJobs = jest.fn().mockResolvedValue([mockUnifiedJobDto])
      jest.spyOn(service, 'upsertJob').mockResolvedValue(undefined)

      // Act
      await service.fetchAndStoreJobs()

      // Assert
      expect(mockJobProviders[0].fetchJobs).toHaveBeenCalled()
      expect(secondProvider.fetchJobs).toHaveBeenCalled()
      expect(service.upsertJob).toHaveBeenCalledTimes(2)
    })

    it('should handle empty job arrays from providers', async () => {
      // Arrange
      mockJobProviders[0].fetchJobs = jest.fn().mockResolvedValue([])
      jest.spyOn(service, 'upsertJob').mockResolvedValue(undefined)

      // Act
      await service.fetchAndStoreJobs()

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Processing 0 jobs from provider',
      })
      expect(service.upsertJob).not.toHaveBeenCalled()
    })
  })

  describe('upsertJob', () => {
    it('should create new company, skills, job and provider job when they do not exist', async () => {
      // Arrange
      mockCompanyRepo.findOne.mockResolvedValue(null)
      mockCompanyRepo.create.mockReturnValue(mockCompany)
      mockCompanyRepo.save.mockResolvedValue(mockCompany)

      mockSkillRepo.findOne.mockResolvedValue(null)
      mockSkillRepo.create.mockReturnValue(mockSkill)
      mockSkillRepo.save.mockResolvedValue(mockSkill)

      mockProviderJobRepo.findOne.mockResolvedValue(null)

      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)

      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(mockUnifiedJobDto)

      // Assert
      expect(mockCompanyRepo.findOne).toHaveBeenCalledWith({ where: { name: mockUnifiedJobDto.company.name } })
      expect(mockCompanyRepo.create).toHaveBeenCalledWith(mockUnifiedJobDto.company)
      expect(mockCompanyRepo.save).toHaveBeenCalledWith(mockCompany)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Created new company: ${mockUnifiedJobDto.company.name}`,
      })

      expect(mockSkillRepo.findOne).toHaveBeenCalledTimes(3)
      expect(mockSkillRepo.create).toHaveBeenCalledTimes(3)
      expect(mockSkillRepo.save).toHaveBeenCalledTimes(3)

      expect(mockProviderJobRepo.findOne).toHaveBeenCalledWith({
        where: { provider: mockUnifiedJobDto.provider, providerJobId: mockUnifiedJobDto.providerJobId },
        relations: ['job'],
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith({
        title: mockUnifiedJobDto.title,
        location: mockUnifiedJobDto.location,
        type: mockUnifiedJobDto.type,
        salaryRange: mockUnifiedJobDto.salaryRange,
        postedDate: mockUnifiedJobDto.postedDate,
        company: mockCompany,
        skills: expect.any(Array),
      })
      expect(mockJobRepo.save).toHaveBeenCalledWith(mockJob)

      expect(mockProviderJobRepo.create).toHaveBeenCalledWith({
        provider: mockUnifiedJobDto.provider,
        providerJobId: mockUnifiedJobDto.providerJobId,
        job: mockJob,
      })
      expect(mockProviderJobRepo.save).toHaveBeenCalledWith(mockProviderJob)

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Created new job: ${mockUnifiedJobDto.title} from ${mockUnifiedJobDto.provider}`,
      })
    })

    it('should use existing company when it already exists', async () => {
      // Arrange
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)
      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(mockUnifiedJobDto)

      // Assert
      expect(mockCompanyRepo.findOne).toHaveBeenCalledWith({ where: { name: mockUnifiedJobDto.company.name } })
      expect(mockCompanyRepo.create).not.toHaveBeenCalled()
      expect(mockCompanyRepo.save).not.toHaveBeenCalled()
      expect(mockLoggerService.create).not.toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Created new company: ${mockUnifiedJobDto.company.name}`,
      })
    })

    it('should use existing skills when they already exist', async () => {
      // Arrange
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)
      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(mockUnifiedJobDto)

      // Assert
      expect(mockSkillRepo.findOne).toHaveBeenCalledTimes(3)
      expect(mockSkillRepo.create).not.toHaveBeenCalled()
      expect(mockSkillRepo.save).not.toHaveBeenCalled()
    })

    it('should skip job creation when provider job already exists', async () => {
      // Arrange
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(mockUnifiedJobDto)

      // Assert
      expect(mockProviderJobRepo.findOne).toHaveBeenCalledWith({
        where: { provider: mockUnifiedJobDto.provider, providerJobId: mockUnifiedJobDto.providerJobId },
        relations: ['job'],
      })
      expect(mockJobRepo.create).not.toHaveBeenCalled()
      expect(mockJobRepo.save).not.toHaveBeenCalled()
      expect(mockProviderJobRepo.create).not.toHaveBeenCalled()
      expect(mockProviderJobRepo.save).not.toHaveBeenCalled()
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.DEBUG,
        message: `Job already exists: ${mockUnifiedJobDto.title} (${mockUnifiedJobDto.providerJobId})`,
      })
    })

    it('should handle job with no skills', async () => {
      // Arrange
      const jobWithoutSkills = { ...mockUnifiedJobDto, skills: [] }
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)
      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(jobWithoutSkills)

      // Assert
      expect(mockSkillRepo.findOne).not.toHaveBeenCalled()
      expect(mockJobRepo.create).toHaveBeenCalledWith({
        title: jobWithoutSkills.title,
        location: jobWithoutSkills.location,
        type: jobWithoutSkills.type,
        salaryRange: jobWithoutSkills.salaryRange,
        postedDate: jobWithoutSkills.postedDate,
        company: mockCompany,
        skills: [],
      })
    })

    it('should handle job with optional fields missing', async () => {
      // Arrange
      const jobWithoutOptionalFields = {
        ...mockUnifiedJobDto,
        type: undefined,
        salaryRange: undefined,
      }
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)
      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockResolvedValue(mockProviderJob)

      // Act
      await service.upsertJob(jobWithoutOptionalFields)

      // Assert
      expect(mockJobRepo.create).toHaveBeenCalledWith({
        title: jobWithoutOptionalFields.title,
        location: jobWithoutOptionalFields.location,
        type: undefined,
        salaryRange: undefined,
        postedDate: jobWithoutOptionalFields.postedDate,
        company: mockCompany,
        skills: expect.any(Array),
      })
    })

    it('should handle database error during company creation and throw', async () => {
      // Arrange
      const errorMessage = 'Database connection failed'
      mockCompanyRepo.findOne.mockResolvedValue(null)
      mockCompanyRepo.create.mockReturnValue(mockCompany)
      mockCompanyRepo.save.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(service.upsertJob(mockUnifiedJobDto)).rejects.toThrow(errorMessage)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Failed to upsert job ${mockUnifiedJobDto.title}: ${errorMessage}`,
      })
    })

    it('should handle database error during skill creation and throw', async () => {
      // Arrange
      const errorMessage = 'Skill creation failed'
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(null)
      mockSkillRepo.create.mockReturnValue(mockSkill)
      mockSkillRepo.save.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(service.upsertJob(mockUnifiedJobDto)).rejects.toThrow(errorMessage)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Failed to upsert job ${mockUnifiedJobDto.title}: ${errorMessage}`,
      })
    })

    it('should handle database error during job creation and throw', async () => {
      // Arrange
      const errorMessage = 'Job creation failed'
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(service.upsertJob(mockUnifiedJobDto)).rejects.toThrow(errorMessage)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Failed to upsert job ${mockUnifiedJobDto.title}: ${errorMessage}`,
      })
    })

    it('should handle database error during provider job creation and throw', async () => {
      // Arrange
      const errorMessage = 'Provider job creation failed'
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany)
      mockSkillRepo.findOne.mockResolvedValue(mockSkill)
      mockProviderJobRepo.findOne.mockResolvedValue(null)
      mockJobRepo.create.mockReturnValue(mockJob)
      mockJobRepo.save.mockResolvedValue(mockJob)
      mockProviderJobRepo.create.mockReturnValue(mockProviderJob)
      mockProviderJobRepo.save.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(service.upsertJob(mockUnifiedJobDto)).rejects.toThrow(errorMessage)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Failed to upsert job ${mockUnifiedJobDto.title}: ${errorMessage}`,
      })
    })
  })
})
