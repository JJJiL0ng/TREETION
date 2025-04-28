// src/audio/audio.controller.ts
import { 
    Controller, 
    Post, 
    Get, 
    Param, 
    Delete, 
    Patch, 
    UseInterceptors, 
    UploadedFile, 
    Body, 
    UseGuards,
    Request,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { ApiConsumes, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
  
  import { CreateAudioDto } from './dto/create-audio.dto';
  import { AudioService } from './audio.service';
  import { UpdateAudioDto } from './dto/update-audio.dto';
  
  @ApiTags('audio')
  @Controller('audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class AudioController {
    constructor(private readonly audioService: AudioService) {}
  
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
          title: {
            type: 'string',
          },
          audioFileType: {
            type: 'string',
          },
        },
      },
    })
    async uploadAudio(
      @UploadedFile() file: Express.Multer.File,
      @Body('title') title: string,
      @Body('audioFileType') audioFileType: string,
      @Request() req
    ) {
      console.log('수신된 파일:', file);
      console.log('파일 크기:', file.size);
      console.log('MIME 타입:', file.mimetype);
      const createAudioDto = new CreateAudioDto();
      createAudioDto.title = title;
      createAudioDto.audioFileType = audioFileType;
      createAudioDto.user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture,
        isEmailVerified: req.user.isEmailVerified
      };
      
      return this.audioService.createAudio(file, createAudioDto);
    }
  
    @Get()
    async findAll(@Request() req) {
      return this.audioService.findAll(req.user.id);
    }
  
    @Get(':id')
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
      @Request() req
    ) {
      return this.audioService.findOne(id, req.user.id);
    }
  
    @Patch(':id')
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateAudioDto: UpdateAudioDto,
      @Request() req
    ) {
      return this.audioService.update(id, req.user.id, updateAudioDto);
    }
  
    @Delete(':id')
    async remove(
      @Param('id', ParseUUIDPipe) id: string,
      @Request() req
    ) {
      return { success: await this.audioService.remove(id, req.user.id) };
    }
  }