import * as moment from 'moment'
import { format } from 'winston'

export const fileFormat: ReturnType<typeof format.combine> = format.combine(
  format.splat(),
  format.timestamp(),
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
      const dateTime = moment().format('YYYY/MM/DD hh:mm:ss')
      const levelStr = level.toUpperCase().padStart(7)

      const moduleName = source?.moduleName
      const fileName = source?.fileName
      const hasSource = moduleName || fileName
      const sourceStr = hasSource ? `[${moduleName ?? ''} ${fileName ?? ''}]` : ''

      return `${dateTime} ${levelStr}${sourceStr ? ` ${sourceStr}` : ''} ${message}`
    },
  ),
)
