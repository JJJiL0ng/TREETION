// src/class/class.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto, ClassResponseDto, ClassWithAudiosResponseDto, UpdateClassOrderDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  async create(@Request() req, @Body() createClassDto: CreateClassDto) {
    const userId = req.user.id;
    const classEntity = await this.classService.create(userId, createClassDto);
    return plainToClass(ClassResponseDto, classEntity, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(@Request() req) {
    const userId = req.user.id;
    const classes = await this.classService.findAll(userId);
    return classes.map(cls => plainToClass(ClassResponseDto, cls, { excludeExtraneousValues: true }));
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    const classEntity = await this.classService.findOne(id, userId);
    return plainToClass(ClassWithAudiosResponseDto, classEntity, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    const userId = req.user.id;
    const updatedClass = await this.classService.update(id, userId, updateClassDto);
    return plainToClass(ClassResponseDto, updatedClass, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.id;
    await this.classService.remove(id, userId);
    return { message: 'Class deleted successfully' };
  }

  @Patch('order/update')
  async updateOrder(@Request() req, @Body() updateOrderDto: UpdateClassOrderDto) {
    const userId = req.user.id;
    const updatedClasses = await this.classService.updateOrder(userId, updateOrderDto);
    return updatedClasses.map(cls => plainToClass(ClassResponseDto, cls, { excludeExtraneousValues: true }));
  }

  // 오디오 관련 엔드포인트
  @Patch('audio/:audioId/add-to-class/:classId')
  async addAudioToClass(
    @Request() req,
    @Param('audioId') audioId: string,
    @Param('classId') classId: string
  ) {
    const userId = req.user.id;
    const audio = await this.classService.addAudioToClass(audioId, classId, userId);
    return { message: 'Audio added to class successfully', audioId: audio.id, classId };
  }

  @Patch('audio/:audioId/remove-from-class')
  async removeAudioFromClass(
    @Request() req,
    @Param('audioId') audioId: string
  ) {
    const userId = req.user.id;
    const audio = await this.classService.removeAudioFromClass(audioId, userId);
    return { message: 'Audio removed from class successfully', audioId: audio.id };
  }

  @Get(':classId/audios')
  async findAllAudiosByClass(
    @Request() req,
    @Param('classId') classId: string
  ) {
    const userId = req.user.id;
    const audios = await this.classService.findAllAudiosByClass(classId, userId);
    return audios;
  }
}