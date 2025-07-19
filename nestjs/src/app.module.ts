import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './database/config/typeorm.config'
import { LoggerModule } from './modules/logger/logger.module'
import { TypeormLoggerService } from './modules/logger/services/typeorm-logger.service'
import { APP_FILTER } from '@nestjs/core'
import { GlobalExceptionFilter } from './filters/global-exception.filter'
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService, TypeormLoggerService],
      useFactory: (configService: ConfigService, logger: TypeormLoggerService) => {
        return {
          ...typeormConfig(),
          logger,
        }
      },
    }),
    LoggerModule,
  ],
})
export class AppModule {}
