import { Global, Module } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import { winstonLoggerConfig } from './configs/winstonLogger.config'
import { LoggerService } from './services/logger.service'
import { TypeormLoggerService } from './services/typeorm-logger.service'

@Global()
@Module({
  providers: [
    { provide: 'WINSTON_LOGGER', useValue: WinstonModule.createLogger(winstonLoggerConfig) },
    LoggerService,
    TypeormLoggerService,
  ],
  exports: [LoggerService, TypeormLoggerService],
})
export class LoggerModule {}
