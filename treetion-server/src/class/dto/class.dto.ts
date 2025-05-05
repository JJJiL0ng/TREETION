// src/class/dto/class.dto.ts
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsArray, IsNumber } from 'class-validator';
import { AudioEntity } from '../../audio/entities/audio.entity';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;
}

export class ClassResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  userId: string;

  @Expose()
  order: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ClassResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ClassWithAudiosResponseDto extends ClassResponseDto {
  @Expose()
  @Type(() => AudioEntity)
  audios: AudioEntity[];
}

export class UpdateClassOrderDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  classIds: string[];
}