import { Test, TestingModule } from '@nestjs/testing';
import { Provider2Service } from './provider2.service';

describe('Provider2Service', () => {
  let service: Provider2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Provider2Service],
    }).compile();

    service = module.get<Provider2Service>(Provider2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
