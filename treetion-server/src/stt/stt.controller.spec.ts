import { Test, TestingModule } from '@nestjs/testing';
import { STTController } from './stt.controller';

describe('SttController', () => {
  let controller: STTController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [STTController],
    }).compile();

    controller = module.get<STTController>(STTController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
