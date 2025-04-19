import { Test, TestingModule } from '@nestjs/testing';
import { SttController } from './stt.controller';

describe('SttController', () => {
  let controller: SttController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SttController],
    }).compile();

    controller = module.get<SttController>(SttController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
