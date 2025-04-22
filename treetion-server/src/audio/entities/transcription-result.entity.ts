// src/audio/entities/transcription-result.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Transcription } from './transcription.entity';

@Entity('transcription_results')
export class TranscriptionResult {
  @PrimaryColumn()
  transcriptionId: string;

  @Column()
  audioId: string;

  @Column()
  language: string;

  @Column('text')
  text: string;

  @Column('json')
  segments: {
    id: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
  }[];

  @Column('json')
  paragraphs: {
    id: string;
    segments: string[];
    start: number;
    end: number;
  }[];

  @Column('json')
  metadata: {
    wordCount: number;
    duration: number;
    createdAt: Date;
    completedAt: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Transcription)
  @JoinColumn({ name: 'transcriptionId' })
  transcription: Transcription;
}