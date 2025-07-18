import { registerAs } from '@nestjs/config'
import { config as dotenvConfig } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'

const environmentName = process.env.NODE_ENV || 'development'
console.info(`The environment is: ${environmentName}`)

dotenvConfig({ quiet: true })

const config = {
  type: 'postgres',
  host: `${process.env.DATABASE_HOST}`,
  port: `${process.env.DATABASE_PORT}`,
  username: `${process.env.DATABASE_USERNAME}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}`,
  autoLoadEntities: true,
  synchronize: false,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  logging: ['query'],
}

const configEnvMap = new Map<string, Partial<DataSourceOptions>>([
  [
    'development',
    {
      synchronize: false,
    },
  ],
  [
    'testing',
    {
      host: `${process.env.TEST_DATABASE_HOST}`,
      password: `${process.env.TEST_DATABASE_PASSWORD}`,
      synchronize: true,
      dropSchema: true,
    },
  ],
])

function getConfig(): DataSourceOptions {
  const envConfig = configEnvMap.get(environmentName)
  if (envConfig === undefined) {
    throw new Error(`Unexpected value [${environmentName}]`)
  }
  return { ...config, ...envConfig } as DataSourceOptions
}

export default registerAs('typeormConfig', () => getConfig())
export const connectionSource = new DataSource(config as DataSourceOptions)
