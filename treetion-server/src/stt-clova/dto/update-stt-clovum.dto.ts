import { PartialType } from '@nestjs/swagger';
import { CreateSttClovumDto } from './create-stt-clovum.dto';

export class UpdateSttClovumDto extends PartialType(CreateSttClovumDto) {}
