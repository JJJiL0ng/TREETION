import { Controller } from '@nestjs/common';
import { SttUpgradeService } from './stt-upgrade.service';

@Controller('stt-upgrade')
export class SttUpgradeController {
  constructor(private readonly sttUpgradeService: SttUpgradeService) {}
}
