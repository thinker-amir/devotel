import { WinstonModuleOptions } from 'nest-winston'
import { config, transports } from 'winston'
import 'winston-daily-rotate-file'
import { LogLevel } from '../enums/LogLevel.enum'
import { consoleFormat } from './formats/console.format'
import { fileFormat } from './formats/file.format'

export const winstonLoggerConfig: WinstonModuleOptions = {
  levels: config.npm.levels,
  transports: [
    new transports.DailyRotateFile({
      filename: `logs/%DATE%.log`,
      format: fileFormat,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '30d',
      level: process.env.LOGGER_FILE_LEVEL ?? LogLevel.HTTP,
    }),
    new transports.Console({
      format: consoleFormat,
      level: process.env.LOGGER_CONSOLE_LEVEL ?? LogLevel.HTTP,
    }),
  ],
}
