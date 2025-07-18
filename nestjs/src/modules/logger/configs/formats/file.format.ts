import * as moment from 'moment'
import { format } from 'winston'
import { LogType } from '../../enums/LogType.enum'

export const fileFormat: ReturnType<typeof format.combine> = format.combine(
  format.splat(),
  format.timestamp(),
  format.printf(
    ({
      type,
      timestamp,
      level,
      message,
      source,
    }: {
      type: LogType
      timestamp: string
      level: string
      message: string
      source?: { moduleName?: string; fileName?: string }
    }) => {
      const dateTime = moment(timestamp).format('YYYY/MM/DD hh:mm:ss')
      const typeStr = (type ?? '').padEnd(3)
      const levelStr = level.toUpperCase().padStart(9)

      const moduleName = source?.moduleName
      const fileName = source?.fileName
      const hasSource = moduleName || fileName
      const sourceStr = hasSource ? `[${moduleName ?? ''} ${fileName ?? ''}]` : ''

      return `${dateTime} ${typeStr}${levelStr}${sourceStr ? ` ${sourceStr}` : ''} ${message}`
    },
  ),
)
