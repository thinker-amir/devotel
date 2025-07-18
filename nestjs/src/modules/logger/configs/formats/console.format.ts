import * as moment from 'moment'
import { format } from 'winston'
import { LogLevel } from '../../enums/LogLevel.enum'

const colorizer = format.colorize()

export const consoleFormat: ReturnType<typeof format.combine> = format.combine(
  format.splat(),
  format.timestamp(),
  format.colorize({ all: false, message: true }),
  format.printf(
    ({
      level,
      message,
      source,
    }: {
      timestamp: string
      level: string
      message: string
      source?: { moduleName?: string; fileName?: string }
    }) => {
      const dateTime = moment().format('MM/DD/YYYY, h:mm:ss A')
      const levelStr = (colorizer as any).colorize(level, level.toUpperCase().padStart(7))
      const loggerTag = (colorizer as any).colorize(level, '[  Logger  ]')

      const moduleName = source?.moduleName
      const fileName = source?.fileName
      const hasSource = moduleName || fileName
      const sourceStr = hasSource
        ? (colorizer as any).colorize(LogLevel.WARN, `[${moduleName ?? ''} ${fileName ?? ''}]`)
        : ''

      return `${loggerTag} - ${dateTime} ${levelStr}${sourceStr ? ` ${sourceStr}` : ''} ${message}`
    },
  ),
)
