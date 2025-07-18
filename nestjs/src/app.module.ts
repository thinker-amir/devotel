import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import typeormConfig from './database/config/typeorm.config'
import { LoggerModule } from './modules/logger/logger.module'
import { TypeormLoggerService } from './modules/logger/services/typeorm-logger.service'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService, TypeormLoggerService],
      useFactory: (configService: ConfigService, logger: TypeormLoggerService) => {
        return {
          ...typeormConfig(),
          logger,
        }
      },
    }),
  ],
})
export class AppModule {}
