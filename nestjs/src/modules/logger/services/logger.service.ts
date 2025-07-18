import { Inject, Injectable, LoggerService as NestJsLoggerService } from '@nestjs/common'
import { LogLevel } from '../enums/LogLevel.enum'
import { LogType } from '../enums/LogType.enum'

@Injectable()
export class LoggerService {
  private source = { moduleName: '', fileName: '' }

  constructor(@Inject('WINSTON_LOGGER') private readonly winston: NestJsLoggerService) {}

  create(option: { type?: LogType; level: LogLevel; message: any }) {
    const data = {
      type: option.type ?? LogType.APP,
      level: option.level,
      message: option.message,
      source: this.source,
    }

    this.winston.log(data)
  }

  public setSource(moduleName: string, fileName: string): void {
    this.source = { moduleName, fileName }
  }
}
