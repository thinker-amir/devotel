import { Injectable } from '@nestjs/common'
import { QueryRunner, Logger as TypeOrmLogger } from 'typeorm'
import { LoggerService } from './logger.service'
import { LogType } from '../enums/LogType.enum'
import { LogLevel } from '../enums/LogLevel.enum'
import { LoggerModule } from '../logger.module'

@Injectable()
export class TypeormLoggerService implements TypeOrmLogger {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.setSource(LoggerModule.name, TypeormLoggerService.name)
  }

  /**
   * Logs a standard query execution.
   * Uses VERBOSE level for detailed query logging.
   */
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    const message = this.formatQueryMessage('Query executed', query, parameters)
    this.logWithLevel(LogLevel.VERBOSE, message)
  }

  /**
   * Logs an error that occurred during query execution.
   * Uses ERROR level and includes the error details.
   */
  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    const errorMessage = error instanceof Error ? error.message : error
    const message = this.formatQueryMessage(`Query failed: ${errorMessage}`, query, parameters)
    this.logWithLevel(LogLevel.ERROR, message)
  }

  /**
   * Logs a slow query execution.
   * Uses WARN level to highlight potential performance issues.
   */
  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner): void {
    const message = this.formatQueryMessage(`Slow query detected (execution time: ${time}ms)`, query, parameters)
    this.logWithLevel(LogLevel.WARN, message)
  }

  /**
   * Logs schema build events.
   * Uses INFO level for operational information.
   */
  logSchemaBuild(message: string, queryRunner?: QueryRunner): void {
    this.logWithLevel(LogLevel.INFO, `Schema build: ${message}`)
  }

  /**
   * Logs migration events.
   * Uses INFO level for operational information.
   */
  logMigration(message: string, queryRunner?: QueryRunner): void {
    this.logWithLevel(LogLevel.INFO, `Migration: ${message}`)
  }

  /**
   * General logging method with level mapping.
   * Maps TypeORM log levels to our LogLevel enum.
   */
  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): void {
    let logLevel: LogLevel

    switch (level) {
      case 'log':
      case 'info':
        logLevel = LogLevel.INFO
        break
      case 'warn':
        logLevel = LogLevel.WARN
        break
      default:
        logLevel = LogLevel.VERBOSE // Fallback
    }
    this.logWithLevel(logLevel, `General log [${level}]: ${message}`)
  }

  /**
   * Helper method to log with consistent type and level.
   */
  private logWithLevel(level: LogLevel, message: string): void {
    this.loggerService.create({
      type: LogType.DATABASE,
      level,
      message,
    })
  }

  /**
   * Formats a query message with optional parameters.
   */
  private formatQueryMessage(prefix: string, query: string, parameters?: any[]): string {
    let formatted = `${prefix}: ${query}`
    if (parameters && parameters.length > 0) {
      formatted += ` | Parameters: ${JSON.stringify(parameters)}`
    }
    return formatted
  }
}
