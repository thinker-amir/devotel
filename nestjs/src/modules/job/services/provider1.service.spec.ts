import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Provider1Service } from './provider1.service'
import { LoggerService } from '../../logger/services/logger.service'
import { LogLevel } from '../../logger/enums/LogLevel.enum'
import { PROVIDER_1_JOBS_API } from '../constants'

describe('Provider1Service', () => {
  let service: Provider1Service
  let mockHttpService: any
  let mockConfigService: any
  let mockLoggerService: any

  beforeEach(async () => {
    mockHttpService = {
      axiosRef: {
        get: jest.fn(),
      },
    }

    mockConfigService = {
      get: jest.fn().mockReturnValue('https://api.provider1.com/jobs'),
    }

    mockLoggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Provider1Service,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile()

    service = module.get<Provider1Service>(Provider1Service)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should set source on construction', () => {
    expect(mockLoggerService.setSource).toHaveBeenCalledWith('JobModule', 'Provider1Service')
  })

  describe('loadApiUrl', () => {
    it('should load API URL successfully when configuration is present', () => {
      // Arrange
      const apiUrl = 'https://api.provider1.com/jobs'
      mockConfigService.get.mockReturnValue(apiUrl)

      // Act
      service.loadApiUrl()

      // Assert
      expect(mockConfigService.get).toHaveBeenCalledWith(PROVIDER_1_JOBS_API)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Provider1 API URL loaded: ${apiUrl}`,
      })
      expect(service['apiUrl']).toBe(apiUrl)
    })

    it('should throw error and log when configuration is missing', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined)

      // Act & Assert
      expect(() => service.loadApiUrl()).toThrow(`Missing required configuration: ${PROVIDER_1_JOBS_API}`)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_1_JOBS_API}`,
      })
    })

    it('should throw error and log when configuration is empty string', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('')

      // Act & Assert
      expect(() => service.loadApiUrl()).toThrow(`Missing required configuration: ${PROVIDER_1_JOBS_API}`)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_1_JOBS_API}`,
      })
    })
  })

  describe('fetchJobs', () => {
    const mockApiResponse = {
      data: {
        jobs: [
          {
            title: 'Software Engineer',
            details: {
              location: 'San Francisco, CA',
              type: 'Full-time',
              salaryRange: '$100,000 - $150,000',
            },
            postedDate: '2023-01-15T10:00:00Z',
            company: 'Tech Corp',
            skills: ['JavaScript', 'Node.js', 'React'],
            jobId: 'job-123',
          },
          {
            title: 'Frontend Developer',
            details: {
              location: 'New York, NY',
              type: 'Contract',
              salaryRange: '$80,000 - $120,000',
            },
            postedDate: '2023-01-16T15:30:00Z',
            company: 'Design Studio',
            skills: ['Vue.js', 'CSS', 'TypeScript'],
            jobId: 'job-456',
          },
        ],
      },
    }

    const expectedUnifiedJobs = [
      {
        title: 'Software Engineer',
        location: 'San Francisco, CA',
        type: 'Full-time',
        salaryRange: '$100,000 - $150,000',
        postedDate: new Date('2023-01-15T10:00:00Z'),
        company: 'Tech Corp',
        skills: ['JavaScript', 'Node.js', 'React'],
        provider: 'provider1',
        providerJobId: 'job-123',
      },
      {
        title: 'Frontend Developer',
        location: 'New York, NY',
        type: 'Contract',
        salaryRange: '$80,000 - $120,000',
        postedDate: new Date('2023-01-16T15:30:00Z'),
        company: 'Design Studio',
        skills: ['Vue.js', 'CSS', 'TypeScript'],
        provider: 'provider1',
        providerJobId: 'job-456',
      },
    ]

    it('should fetch and transform jobs successfully', async () => {
      // Arrange
      mockHttpService.axiosRef.get.mockResolvedValue(mockApiResponse)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(mockHttpService.axiosRef.get).toHaveBeenCalledWith(service['apiUrl'])
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider1',
      })
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Successfully fetched 2 jobs from Provider1',
      })
      expect(result).toEqual(expectedUnifiedJobs)
    })

    it('should handle empty jobs array', async () => {
      // Arrange
      const emptyResponse = { data: { jobs: [] } }
      mockHttpService.axiosRef.get.mockResolvedValue(emptyResponse)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result).toEqual([])
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Successfully fetched 0 jobs from Provider1',
      })
    })

    it('should handle HTTP request error', async () => {
      // Arrange
      const error = new Error('Network error')
      mockHttpService.axiosRef.get.mockRejectedValue(error)

      // Act & Assert
      await expect(service.fetchJobs()).rejects.toThrow('Network error')
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider1',
      })
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Failed to fetch jobs from Provider1: Network error',
      })
    })

    it('should handle API timeout error', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'ECONNABORTED'
      mockHttpService.axiosRef.get.mockRejectedValue(timeoutError)

      // Act & Assert
      await expect(service.fetchJobs()).rejects.toThrow('Request timeout')
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Failed to fetch jobs from Provider1: Request timeout',
      })
    })

    it('should handle malformed API response', async () => {
      // Arrange
      const malformedResponse = { data: { jobs: null } }
      mockHttpService.axiosRef.get.mockResolvedValue(malformedResponse)

      // Act & Assert
      await expect(service.fetchJobs()).rejects.toThrow()
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider1',
      })
    })

    it('should handle jobs with missing optional fields', async () => {
      // Arrange
      const responseWithMissingFields = {
        data: {
          jobs: [
            {
              title: 'Basic Job',
              details: {
                location: 'Remote',
                type: undefined,
                salaryRange: undefined,
              },
              postedDate: '2023-01-15T10:00:00Z',
              company: 'Basic Company',
              skills: [],
              jobId: 'basic-job-123',
            },
          ],
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(responseWithMissingFields)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result).toEqual([
        {
          title: 'Basic Job',
          location: 'Remote',
          type: undefined,
          salaryRange: undefined,
          postedDate: new Date('2023-01-15T10:00:00Z'),
          company: 'Basic Company',
          skills: [],
          provider: 'provider1',
          providerJobId: 'basic-job-123',
        },
      ])
    })

    it('should handle invalid date format gracefully', async () => {
      // Arrange
      const responseWithInvalidDate = {
        data: {
          jobs: [
            {
              title: 'Job with Invalid Date',
              details: {
                location: 'Remote',
                type: 'Full-time',
                salaryRange: '$50,000',
              },
              postedDate: 'invalid-date',
              company: 'Test Company',
              skills: ['JavaScript'],
              jobId: 'invalid-date-job',
            },
          ],
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(responseWithInvalidDate)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result[0].postedDate).toBeInstanceOf(Date)
      expect(isNaN(result[0].postedDate.getTime())).toBe(true) // Invalid Date
    })
  })
})
