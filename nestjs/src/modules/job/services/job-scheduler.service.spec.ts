import { Test, TestingModule } from '@nestjs/testing'
import { JobSchedulerService } from './job-scheduler.service'
import { JobService } from './job.service'
import { LoggerService } from '../../logger/services/logger.service'
import { LogLevel } from '../../logger/enums/LogLevel.enum'

describe('JobSchedulerService', () => {
  let service: JobSchedulerService
  let mockJobService: any
  let mockLoggerService: any

  beforeEach(async () => {
    mockJobService = {
      fetchAndStoreJobs: jest.fn(),
    }

    mockLoggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSchedulerService,
        {
          provide: JobService,
          useValue: mockJobService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile()

    service = module.get<JobSchedulerService>(JobSchedulerService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should set source on construction', () => {
    expect(mockLoggerService.setSource).toHaveBeenCalledWith('JobModule', 'JobSchedulerService')
  })

  describe('handleCron', () => {
    it('should successfully fetch and store jobs', async () => {
      // Arrange
      mockJobService.fetchAndStoreJobs.mockResolvedValue(undefined)

      // Act
      await service.handleCron()

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })
      expect(mockJobService.fetchAndStoreJobs).toHaveBeenCalledTimes(1)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Scheduled job fetch completed successfully',
      })
      expect(mockLoggerService.create).toHaveBeenCalledTimes(2)
    })

    it('should log error and rethrow when fetchAndStoreJobs fails', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch jobs from API'
      const error = new Error(errorMessage)
      mockJobService.fetchAndStoreJobs.mockRejectedValue(error)

      // Act & Assert
      await expect(service.handleCron()).rejects.toThrow(errorMessage)

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })
      expect(mockJobService.fetchAndStoreJobs).toHaveBeenCalledTimes(1)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: `Scheduled job fetch failed: ${errorMessage}`,
      })
      expect(mockLoggerService.create).toHaveBeenCalledTimes(2)
    })

    it('should handle error without message property', async () => {
      // Arrange
      const error = { code: 'UNKNOWN_ERROR' } // Non-Error object without message
      mockJobService.fetchAndStoreJobs.mockRejectedValue(error)

      // Act & Assert
      await expect(service.handleCron()).rejects.toEqual(error)

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })
      expect(mockJobService.fetchAndStoreJobs).toHaveBeenCalledTimes(1)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Scheduled job fetch failed: undefined',
      })
      expect(mockLoggerService.create).toHaveBeenCalledTimes(2)
    })

    it('should handle network timeout error', async () => {
      // Arrange
      const error = new Error('Network timeout')
      mockJobService.fetchAndStoreJobs.mockRejectedValue(error)

      // Act & Assert
      await expect(service.handleCron()).rejects.toThrow('Network timeout')

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })
      expect(mockJobService.fetchAndStoreJobs).toHaveBeenCalledTimes(1)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Scheduled job fetch failed: Network timeout',
      })
      expect(mockLoggerService.create).toHaveBeenCalledTimes(2)
    })

    it('should handle database connection error', async () => {
      // Arrange
      const error = new Error('Database connection failed')
      mockJobService.fetchAndStoreJobs.mockRejectedValue(error)

      // Act & Assert
      await expect(service.handleCron()).rejects.toThrow('Database connection failed')

      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.INFO,
        message: 'Starting scheduled job fetch',
      })
      expect(mockJobService.fetchAndStoreJobs).toHaveBeenCalledTimes(1)
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        level: LogLevel.ERROR,
        message: 'Scheduled job fetch failed: Database connection failed',
      })
      expect(mockLoggerService.create).toHaveBeenCalledTimes(2)
    })
  })
})
