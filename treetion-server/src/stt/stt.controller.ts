import { Controller } from '@nestjs/common';
import { SttService } from './stt.service';

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}
}
