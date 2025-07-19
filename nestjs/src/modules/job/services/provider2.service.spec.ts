import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { Provider2Service } from './provider2.service'
import { LoggerService } from '../../logger/services/logger.service'
import { LogLevel } from '../../logger/enums/LogLevel.enum'
import { PROVIDER_2_JOBS_API } from '../constants'

describe('Provider2Service', () => {
  let service: Provider2Service
  let mockHttpService: any
  let mockConfigService: any
  let mockLoggerService: any

  const mockApiUrl = 'https://api.provider2.com/jobs'
  const mockJobResponse = {
    data: {
      status: 'success',
      data: {
        jobsList: {
          'job-116': {
            position: 'Backend Engineer',
            location: { city: 'San Francisco', state: 'NY', remote: true },
            compensation: { min: 57000, max: 104000, currency: 'USD' },
            employer: {
              companyName: 'BackEnd Solutions',
              website: 'https://techcorp.com',
            },
            requirements: {
              experience: 2,
              technologies: ['JavaScript', 'Node.js', 'React'],
            },
            datePosted: '2025-07-15',
          },
          'job-367': {
            position: 'Frontend Developer',
            location: { city: 'Austin', state: 'TX', remote: false },
            compensation: { min: 72000, max: 124000, currency: 'USD' },
            employer: {
              companyName: 'TechCorp',
              website: 'https://dataworks.com',
            },
            requirements: {
              experience: 1,
              technologies: ['HTML', 'CSS', 'Vue.js'],
            },
            datePosted: '2025-07-09',
          },
        },
      },
    },
  }

  beforeEach(async () => {
    mockHttpService = {
      axiosRef: {
        get: jest.fn(),
      },
    }

    mockConfigService = {
      get: jest.fn().mockReturnValue(mockApiUrl),
    }

    mockLoggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Provider2Service,
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

    service = module.get<Provider2Service>(Provider2Service)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should set source on construction', () => {
    expect(mockLoggerService.setSource).toHaveBeenCalledWith('JobModule', 'Provider2Service')
  })

  describe('loadApiUrl', () => {
    it('should load API URL successfully when configuration is present', () => {
      // Arrange
      const apiUrl = 'https://api.provider2.com/jobs'
      mockConfigService.get.mockReturnValue(apiUrl)

      // Act
      service.loadApiUrl()

      // Assert
      expect(mockConfigService.get).toHaveBeenCalledWith(PROVIDER_2_JOBS_API)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: `Provider2 API URL loaded: ${apiUrl}`,
      })
      expect(service['apiUrl']).toBe(apiUrl)
    })

    it('should throw error and log when configuration is missing', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined)

      // Act & Assert
      expect(() => service.loadApiUrl()).toThrow(`Missing required configuration: ${PROVIDER_2_JOBS_API}`)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_2_JOBS_API}`,
      })
    })

    it('should throw error and log when configuration is empty string', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('')

      // Act & Assert
      expect(() => service.loadApiUrl()).toThrow(`Missing required configuration: ${PROVIDER_2_JOBS_API}`)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Missing required configuration: ${PROVIDER_2_JOBS_API}`,
      })
    })
  })

  describe('fetchJobs', () => {
    it('should successfully fetch and transform jobs', async () => {
      // Arrange
      mockHttpService.axiosRef.get.mockResolvedValue(mockJobResponse)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(mockHttpService.axiosRef.get).toHaveBeenCalledWith(mockApiUrl)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider2',
      })
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Successfully fetched 2 jobs from Provider2',
      })

      expect(result).toEqual([
        {
          title: 'Backend Engineer',
          location: 'San Francisco, NY (Remote)',
          type: 'Remote',
          salaryRange: 'USD 57000 - 104000',
          postedDate: new Date('2025-07-15'),
          company: {
            name: 'BackEnd Solutions',
            website: 'https://techcorp.com',
          },
          skills: ['JavaScript', 'Node.js', 'React'],
          provider: 'provider2',
          providerJobId: 'job-116',
        },
        {
          title: 'Frontend Developer',
          location: 'Austin, TX',
          type: 'Onsite',
          salaryRange: 'USD 72000 - 124000',
          postedDate: new Date('2025-07-09'),
          company: {
            name: 'TechCorp',
            website: 'https://dataworks.com',
          },
          skills: ['HTML', 'CSS', 'Vue.js'],
          provider: 'provider2',
          providerJobId: 'job-367',
        },
      ])
    })

    it('should handle jobs without compensation', async () => {
      // Arrange
      const jobResponseWithoutCompensation = {
        data: {
          status: 'success',
          data: {
            jobsList: {
              'job-123': {
                position: 'Test Engineer',
                location: { city: 'Seattle', state: 'WA', remote: false },
                employer: {
                  companyName: 'Test Corp',
                  website: 'https://testcorp.com',
                },
                requirements: {
                  experience: 1,
                  technologies: ['Python', 'pytest'],
                },
                datePosted: '2025-07-10',
              },
            },
          },
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(jobResponseWithoutCompensation)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result).toEqual([
        {
          title: 'Test Engineer',
          location: 'Seattle, WA',
          type: 'Onsite',
          salaryRange: undefined,
          postedDate: new Date('2025-07-10'),
          company: {
            name: 'Test Corp',
            website: 'https://testcorp.com',
          },
          skills: ['Python', 'pytest'],
          provider: 'provider2',
          providerJobId: 'job-123',
        },
      ])
    })

    it('should handle empty jobs list', async () => {
      // Arrange
      const emptyJobResponse = {
        data: {
          status: 'success',
          data: {
            jobsList: {},
          },
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(emptyJobResponse)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result).toEqual([])
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Successfully fetched 0 jobs from Provider2',
      })
    })

    it('should handle HTTP request errors', async () => {
      // Arrange
      const networkError = new Error('Network timeout')
      mockHttpService.axiosRef.get.mockRejectedValue(networkError)

      // Act & Assert
      await expect(service.fetchJobs()).rejects.toThrow('Network timeout')

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting to fetch jobs from Provider2',
      })
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Failed to fetch jobs from Provider2: Network timeout',
      })
    })

    it('should handle API response structure errors', async () => {
      // Arrange
      const malformedResponse = {
        data: {
          error: 'Invalid request',
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(malformedResponse)

      // Act & Assert
      await expect(service.fetchJobs()).rejects.toThrow()

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: expect.stringContaining('Failed to fetch jobs from Provider2:'),
      })
    })

    it('should handle jobs with missing fields gracefully', async () => {
      // Arrange
      const incompleteJobResponse = {
        data: {
          status: 'success',
          data: {
            jobsList: {
              'job-456': {
                position: 'Incomplete Job',
                location: { city: 'Boston', state: 'MA', remote: true },
                employer: {
                  companyName: 'Incomplete Corp',
                },
                requirements: {
                  technologies: ['JavaScript'],
                },
                datePosted: '2025-07-12',
              },
            },
          },
        },
      }
      mockHttpService.axiosRef.get.mockResolvedValue(incompleteJobResponse)

      // Act
      const result = await service.fetchJobs()

      // Assert
      expect(result).toEqual([
        {
          title: 'Incomplete Job',
          location: 'Boston, MA (Remote)',
          type: 'Remote',
          salaryRange: undefined,
          postedDate: new Date('2025-07-12'),
          company: {
            name: 'Incomplete Corp',
            website: undefined,
          },
          skills: ['JavaScript'],
          provider: 'provider2',
          providerJobId: 'job-456',
        },
      ])
    })
  })
})
