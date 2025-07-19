import { Test, TestingModule } from '@nestjs/testing'
import { TypeormLoggerService } from './typeorm-logger.service'
import { LoggerService } from './logger.service'
import { LogLevel } from '../enums/LogLevel.enum'
import { LogType } from '../enums/LogType.enum'

describe('TypeormLoggerService', () => {
  let service: TypeormLoggerService
  let mockLoggerService: any

  beforeEach(async () => {
    mockLoggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormLoggerService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile()

    service = module.get<TypeormLoggerService>(TypeormLoggerService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should set source on construction', () => {
    expect(mockLoggerService.setSource).toHaveBeenCalledWith('LoggerModule', 'TypeormLoggerService')
  })

  describe('logQuery', () => {
    it('should log query with VERBOSE level', () => {
      // Arrange
      const query = 'SELECT * FROM users'
      const parameters = ['param1', 'param2']

      // Act
      service.logQuery(query, parameters)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.VERBOSE,
        message: 'Query executed: SELECT * FROM users | Parameters: ["param1","param2"]',
      })
    })

    it('should log query without parameters', () => {
      // Arrange
      const query = 'SELECT * FROM users'

      // Act
      service.logQuery(query)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.VERBOSE,
        message: 'Query executed: SELECT * FROM users',
      })
    })
  })

  describe('logQueryError', () => {
    it('should log query error with ERROR level using Error object', () => {
      // Arrange
      const error = new Error('Database connection failed')
      const query = 'SELECT * FROM users'
      const parameters = ['param1']

      // Act
      service.logQueryError(error, query, parameters)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.ERROR,
        message: 'Query failed: Database connection failed: SELECT * FROM users | Parameters: ["param1"]',
      })
    })

    it('should log query error with ERROR level using string error', () => {
      // Arrange
      const error = 'Connection timeout'
      const query = 'SELECT * FROM users'

      // Act
      service.logQueryError(error, query)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.ERROR,
        message: 'Query failed: Connection timeout: SELECT * FROM users',
      })
    })
  })

  describe('logQuerySlow', () => {
    it('should log slow query with WARN level', () => {
      // Arrange
      const time = 5000
      const query = 'SELECT * FROM users'
      const parameters = ['param1']

      // Act
      service.logQuerySlow(time, query, parameters)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.WARN,
        message: 'Slow query detected (execution time: 5000ms): SELECT * FROM users | Parameters: ["param1"]',
      })
    })
  })

  describe('logSchemaBuild', () => {
    it('should log schema build with INFO level', () => {
      // Arrange
      const message = 'Building schema for entity User'

      // Act
      service.logSchemaBuild(message)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.INFO,
        message: 'Schema build: Building schema for entity User',
      })
    })
  })

  describe('logMigration', () => {
    it('should log migration with INFO level', () => {
      // Arrange
      const message = 'Running migration CreateUserTable1234567890'

      // Act
      service.logMigration(message)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.INFO,
        message: 'Migration: Running migration CreateUserTable1234567890',
      })
    })
  })

  describe('log', () => {
    it('should log with INFO level for "log" type', () => {
      // Arrange
      const message = 'General log message'

      // Act
      service.log('log', message)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.INFO,
        message: 'General log [log]: General log message',
      })
    })

    it('should log with INFO level for "info" type', () => {
      // Arrange
      const message = 'Info message'

      // Act
      service.log('info', message)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.INFO,
        message: 'General log [info]: Info message',
      })
    })

    it('should log with WARN level for "warn" type', () => {
      // Arrange
      const message = 'Warning message'

      // Act
      service.log('warn', message)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.WARN,
        message: 'General log [warn]: Warning message',
      })
    })
  })

  describe('formatQueryMessage', () => {
    it('should format message with parameters', () => {
      // Arrange
      const query = 'SELECT * FROM users WHERE id = ?'
      const parameters = [1]

      // Act
      service.logQuery(query, parameters)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.VERBOSE,
        message: 'Query executed: SELECT * FROM users WHERE id = ? | Parameters: [1]',
      })
    })

    it('should format message without parameters when empty array', () => {
      // Arrange
      const query = 'SELECT * FROM users'
      const parameters: any[] = []

      // Act
      service.logQuery(query, parameters)

      // Assert
      expect(mockLoggerService.create).toHaveBeenCalledWith({
        type: LogType.DATABASE,
        level: LogLevel.VERBOSE,
        message: 'Query executed: SELECT * FROM users',
      })
    })
  })
})
