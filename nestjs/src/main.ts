import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('Doc')
    .setDescription('The Project API description')
    .setVersion('1.0')
    .addTag('Devotel')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
