import { Test, TestingModule } from '@nestjs/testing'
import { TypeormLoggerService } from './typeorm-logger.service'

describe('TypeormLoggerService', () => {
  let service: TypeormLoggerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeormLoggerService],
    }).compile()

    service = module.get<TypeormLoggerService>(TypeormLoggerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
