import { Module } from '@nestjs/common';
import { SvgService } from './svg.service';
import { SvgController } from './svg.controller';

@Module({
  providers: [SvgService],
  controllers: [SvgController]
})
export class SvgModule {}
