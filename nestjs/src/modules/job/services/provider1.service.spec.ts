import { Test, TestingModule } from '@nestjs/testing';
import { Provider1Service } from './provider1.service';

describe('Provider1Service', () => {
  let service: Provider1Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Provider1Service],
    }).compile();

    service = module.get<Provider1Service>(Provider1Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
