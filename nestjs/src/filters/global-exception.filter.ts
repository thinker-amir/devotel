import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Request, Response } from 'express'
import { LogLevel } from '../modules/logger/enums/LogLevel.enum'
import { LogType } from '../modules/logger/enums/LogType.enum'
import { LoggerService } from '../modules/logger/services/logger.service'
import { ConfigService } from '@nestjs/config'
import { AppModule } from '../app.module'

export const getErrorMessage = (exception: any): string => {
  return exception instanceof HttpException ? exception.message : String(exception)
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.loggerService.setSource(AppModule.name, GlobalExceptionFilter.name)
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    // Extract more request details
    const requestDetails = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent') || 'unknown',
      correlationId: request.headers['x-correlation-id'] || crypto.randomUUID(),
    }

    // Prepare error response
    const errorResponse = {
      statusCode: status,
      timestamp: requestDetails.timestamp,
      path: requestDetails.path,
      correlationId: requestDetails.correlationId,
      message:
        exception instanceof HttpException
          ? exception.getResponse()['message'] || exception.message
          : 'Internal server error',
    }

    // For non-HTTP exceptions, log the full stack trace
    if (!(exception instanceof HttpException)) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack, 'ExceptionFilter')
    }

    // Log detailed error information
    const logData = {
      ...requestDetails,
      statusCode: status,
      error:
        exception instanceof HttpException
          ? exception.getResponse()
          : { message: exception.message, stack: exception.stack },
    }

    this.loggerService.create({
      type: LogType.API,
      level: this.getLogLevel(status),
      message: logData,
    })

    // In production, don't expose error details
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    if (isProduction && (status as HttpStatus) === HttpStatus.INTERNAL_SERVER_ERROR) {
      return response.status(status).json({
        statusCode: status,
        timestamp: requestDetails.timestamp,
        path: requestDetails.path,
        correlationId: requestDetails.correlationId,
        message: 'Internal server error',
      })
    }

    response.status(status).json(errorResponse)
  }

  private getLogLevel(status: number): LogLevel {
    if (status >= 500) return LogLevel.ERROR
    if (status >= 400) return LogLevel.WARN
    return LogLevel.INFO
  }
}
