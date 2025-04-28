// src/audio/dto/audio.dto.ts
import { Expose } from 'class-transformer';

export class AudioDto {
  @Expose()
  id: string;

  @Expose()
  filename: string;

  @Expose()
  originalName: string;

  @Expose()
  path: string;

  @Expose()
  size: number;

  @Expose()
  mimeType: string;

  @Expose()
  url: string;

  @Expose()
  title: string;

  @Expose()
  audioFileType: string;

  @Expose()
  userId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<AudioDto>) {
    Object.assign(this, partial);
  }
}