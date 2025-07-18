import { Global, Module } from '@nestjs/common'
import { LoggerService } from './logger.service'
import { WinstonModule } from 'nest-winston'
import { winstonLoggerConfig } from './configs/winstonLogger.config'

@Global()
@Module({
  providers: [{ provide: 'WINSTON_LOGGER', useValue: WinstonModule.createLogger(winstonLoggerConfig) }, LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
