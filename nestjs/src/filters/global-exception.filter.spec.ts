import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus, ArgumentsHost, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { GlobalExceptionFilter, getErrorMessage } from './global-exception.filter'
import { LoggerService } from '../modules/logger/services/logger.service'
import { LogLevel } from '../modules/logger/enums/LogLevel.enum'
import { LogType } from '../modules/logger/enums/LogType.enum'

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter
  let loggerService: jest.Mocked<LoggerService>
  let configService: jest.Mocked<ConfigService>
  let mockResponse: jest.Mocked<Response>
  let mockRequest: jest.Mocked<Request>
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  beforeEach(async () => {
    // Arrange
    const mockHttpContext = {
      getResponse: jest.fn(),
      getRequest: jest.fn(),
    }

    mockRequest = {
      url: '/test-endpoint',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn(),
      headers: {},
    } as any

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as any

    loggerService = {
      setSource: jest.fn(),
      create: jest.fn(),
    } as any

    mockHttpContext.getResponse.mockReturnValue(mockResponse)
    mockHttpContext.getRequest.mockReturnValue(mockRequest)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: LoggerService,
          useValue: loggerService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile()

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter)
    configService = module.get(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(filter).toBeDefined()
  })

  describe('catch', () => {
    it('should handle HttpException with correct status and message', () => {
      // Arrange
      const httpException = new HttpException('Bad Request', HttpStatus.BAD_REQUEST)
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = { 'x-correlation-id': 'test-correlation-id' }
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: 'test-correlation-id',
        message: 'Bad Request',
      })
    })

    it('should handle HttpException with response object message', () => {
      // Arrange
      const httpException = new HttpException(
        { message: 'Validation failed', errors: ['field is required'] },
        HttpStatus.BAD_REQUEST,
      )
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: expect.any(String),
        message: 'Validation failed',
      })
    })

    it('should handle non-HttpException and return 500 status', () => {
      // Arrange
      const error = new Error('Unexpected error')
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(error, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: expect.any(String),
        message: 'Internal server error',
      })
    })

    it('should generate correlation ID when not present in headers', () => {
      // Arrange
      const httpException = new HttpException('Test error', HttpStatus.BAD_REQUEST)
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')
      const cryptoSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('12345678-1234-1234-1234-123456789012')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(cryptoSpy).toHaveBeenCalled()
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: '12345678-1234-1234-1234-123456789012',
        }),
      )

      cryptoSpy.mockRestore()
    })

    it('should handle missing user-agent header', () => {
      // Arrange
      const httpException = new HttpException('Test error', HttpStatus.BAD_REQUEST)
      mockRequest.get.mockReturnValue(undefined)
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(loggerService.create).toHaveBeenCalledWith({
        type: LogType.API,
        level: LogLevel.WARN,
        message: expect.objectContaining({
          userAgent: 'unknown',
        }),
      })
    })

    it('should log API type with correct log level for different status codes', () => {
      // Arrange
      const testCases = [
        { status: HttpStatus.BAD_REQUEST, expectedLevel: LogLevel.WARN },
        { status: HttpStatus.UNAUTHORIZED, expectedLevel: LogLevel.WARN },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, expectedLevel: LogLevel.ERROR },
        { status: HttpStatus.OK, expectedLevel: LogLevel.INFO },
      ]

      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')

      testCases.forEach(({ status, expectedLevel }) => {
        // Arrange
        const exception = new HttpException('Test error', status)
        jest.clearAllMocks()

        // Act
        filter.catch(exception, mockArgumentsHost)

        // Assert
        expect(loggerService.create).toHaveBeenCalledWith({
          type: LogType.API,
          level: expectedLevel,
          message: expect.any(Object),
        })
      })
    })

    it('should hide error details in production for 500 errors', () => {
      // Arrange
      const error = new Error('Database connection failed')
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('production')

      // Act
      filter.catch(error, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: expect.any(String),
        message: 'Internal server error',
      })
    })

    it('should expose error details in development for 500 errors', () => {
      // Arrange
      const error = new Error('Database connection failed')
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(error, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: expect.any(String),
        message: 'Internal server error',
      })
    })

    it('should expose error details for non-500 errors even in production', () => {
      // Arrange
      const httpException = new HttpException('Validation failed', HttpStatus.BAD_REQUEST)
      mockRequest.get.mockReturnValue('Mozilla/5.0')
      mockRequest.headers = {}
      configService.get.mockReturnValue('production')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test-endpoint',
        correlationId: expect.any(String),
        message: 'Validation failed',
      })
    })

    it('should log complete request details', () => {
      // Arrange
      const httpException = new HttpException('Test error', HttpStatus.BAD_REQUEST)
      mockRequest.get.mockReturnValue('Mozilla/5.0 Chrome')
      mockRequest.headers = { 'x-correlation-id': 'test-id' }
      configService.get.mockReturnValue('development')

      // Act
      filter.catch(httpException, mockArgumentsHost)

      // Assert
      expect(loggerService.create).toHaveBeenCalledWith({
        type: LogType.API,
        level: LogLevel.WARN,
        message: {
          timestamp: expect.any(String),
          path: '/test-endpoint',
          method: 'GET',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Chrome',
          correlationId: 'test-id',
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Test error',
        },
      })
    })
  })

  describe('getLogLevel', () => {
    it('should return ERROR for 5xx status codes', () => {
      // Arrange
      const statusCodes = [500, 501, 502, 503, 504, 599]

      statusCodes.forEach((status) => {
        // Act
        const logLevel = filter['getLogLevel'](status)

        // Assert
        expect(logLevel).toBe(LogLevel.ERROR)
      })
    })

    it('should return WARN for 4xx status codes', () => {
      // Arrange
      const statusCodes = [400, 401, 403, 404, 422, 499]

      statusCodes.forEach((status) => {
        // Act
        const logLevel = filter['getLogLevel'](status)

        // Assert
        expect(logLevel).toBe(LogLevel.WARN)
      })
    })

    it('should return INFO for 2xx and 3xx status codes', () => {
      // Arrange
      const statusCodes = [200, 201, 204, 301, 302, 304, 399]

      statusCodes.forEach((status) => {
        // Act
        const logLevel = filter['getLogLevel'](status)

        // Assert
        expect(logLevel).toBe(LogLevel.INFO)
      })
    })
  })
})

describe('getErrorMessage', () => {
  it('should return HttpException message for HttpException', () => {
    // Arrange
    const httpException = new HttpException('Bad Request', HttpStatus.BAD_REQUEST)

    // Act
    const message = getErrorMessage(httpException)

    // Assert
    expect(message).toBe('Bad Request')
  })

  it('should return string representation for non-HttpException', () => {
    // Arrange
    const error = new Error('Standard error')

    // Act
    const message = getErrorMessage(error)

    // Assert
    expect(message).toBe('Error: Standard error')
  })

  it('should handle primitive types', () => {
    // Arrange
    const testCases = [
      { input: 'string error', expected: 'string error' },
      { input: 123, expected: '123' },
      { input: null, expected: 'null' },
      { input: undefined, expected: 'undefined' },
    ]

    testCases.forEach(({ input, expected }) => {
      // Act
      const message = getErrorMessage(input)

      // Assert
      expect(message).toBe(expected)
    })
  })
})
