// src/audio/entities/transcription.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AudioFile } from './audio-file.entity';

@Entity('transcriptions')
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  transcriptionId: string;

  @Column()
  audioId: string;

  @Column()
  userId: string;

  @Column({ default: 'ko' })
  language: string;

  @Column('json')
  options: {
    punctuation: boolean;
    paragraphs: boolean;
    timestamps: boolean;
  };

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column('float', { default: 0 })
  progress: number;

  @Column({ nullable: true })
  estimatedTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => AudioFile, audioFile => audioFile.transcriptions)
  @JoinColumn({ name: 'audioId' })
  audioFile: AudioFile;
}