import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import typeormConfig from './database/config/typeorm.config'
import { LoggerModule } from './modules/logger/logger.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('typeormConfig') as TypeOrmModuleOptions,
    }),
    LoggerModule,
  ],
})
export class AppModule {}
