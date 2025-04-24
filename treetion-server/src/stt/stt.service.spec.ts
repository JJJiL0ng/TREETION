import { Test, TestingModule } from '@nestjs/testing';
import { STTService } from './stt.service';

describe('SttService', () => {
  let service: STTService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [STTService],
    }).compile();

    service = module.get<STTService>(STTService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
