import { Module } from '@nestjs/common';
import { TreeService } from './tree.service';
import { TreeController } from './tree.controller';

@Module({
  providers: [TreeService],
  controllers: [TreeController]
})
export class TreeModule {}
