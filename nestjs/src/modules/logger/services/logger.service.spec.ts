import { Test, TestingModule } from '@nestjs/testing'
import { LogLevel } from '../enums/LogLevel.enum'
import { LogType } from '../enums/LogType.enum'
import { LoggerService } from './logger.service'

describe('LoggerService', () => {
  let service: LoggerService
  let mockWinstonLogger: any

  beforeEach(async () => {
    mockWinstonLogger = {
      log: jest.fn(),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: 'WINSTON_LOGGER',
          useValue: mockWinstonLogger,
        },
      ],
    }).compile()

    service = await module.resolve<LoggerService>(LoggerService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should log with default APP type when type is not provided', () => {
      // Arrange
      const message = 'Test message'
      const level = LogLevel.INFO

      // Act
      service.create({ level, message })

      // Assert
      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        type: LogType.APP,
        level,
        message,
        source: { moduleName: '', fileName: '' },
      })
    })

    it('should log with specified type when provided', () => {
      // Arrange
      const message = 'Database error'
      const level = LogLevel.ERROR
      const type = LogType.DATABASE

      // Act
      service.create({ type, level, message })

      // Assert
      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        type,
        level,
        message,
        source: { moduleName: '', fileName: '' },
      })
    })

    it('should log with current source information', () => {
      // Arrange
      const moduleName = 'TestModule'
      const fileName = 'test.service.ts'
      const message = 'Test message'
      const level = LogLevel.DEBUG

      // Act
      service.setSource(moduleName, fileName)
      service.create({ level, message })

      // Assert
      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        type: LogType.APP,
        level,
        message,
        source: { moduleName, fileName },
      })
    })

    it('should handle all log levels', () => {
      // Arrange
      const message = 'Test message'
      const levels = [
        LogLevel.ERROR,
        LogLevel.WARN,
        LogLevel.INFO,
        LogLevel.HTTP,
        LogLevel.VERBOSE,
        LogLevel.DEBUG,
        LogLevel.SILLY,
      ]

      // Act and Assert
      levels.forEach((level) => {
        service.create({ level, message })
        expect(mockWinstonLogger.log).toHaveBeenCalledWith({
          type: LogType.APP,
          level,
          message,
          source: { moduleName: '', fileName: '' },
        })
      })

      expect(mockWinstonLogger.log).toHaveBeenCalledTimes(levels.length)
    })

    it('should handle different message types', () => {
      // Arrange
      const testCases = [
        { message: 'string message', level: LogLevel.INFO },
        { message: { key: 'object message' }, level: LogLevel.DEBUG },
        { message: 123, level: LogLevel.WARN },
        { message: ['array', 'message'], level: LogLevel.ERROR },
      ]

      // Act and Assert
      testCases.forEach(({ message, level }) => {
        service.create({ level, message })
        expect(mockWinstonLogger.log).toHaveBeenCalledWith({
          type: LogType.APP,
          level,
          message,
          source: { moduleName: '', fileName: '' },
        })
      })

      expect(mockWinstonLogger.log).toHaveBeenCalledTimes(testCases.length)
    })
  })

  describe('setSource', () => {
    it('should set source module and file name', () => {
      // Arrange
      const moduleName = 'UserModule'
      const fileName = 'user.service.ts'

      // Act
      service.setSource(moduleName, fileName)
      service.create({ level: LogLevel.INFO, message: 'test' })

      // Assert
      expect(mockWinstonLogger.log).toHaveBeenCalledWith({
        type: LogType.APP,
        level: LogLevel.INFO,
        message: 'test',
        source: { moduleName, fileName },
      })
    })
  })
})
