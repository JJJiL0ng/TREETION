
// src/audio/entities/audio-file.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transcription } from './transcription.entity';

@Entity('audio_files')
export class AudioFile {
  @PrimaryGeneratedColumn('uuid')
  audioId: string;

  @Column()
  fileName: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column('int')
  fileSize: number;

  @Column()
  format: string;

  @Column({ nullable: true })
  sampleRate: number;

  @Column({ nullable: true })
  channels: number;

  @Column({ nullable: true })
  bitrate: number;

  @Column('float')
  duration: number;

  @Column({ default: false })
  hasTranscription: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column()
  storagePath: string;

  @Column({ type: 'simple-array', nullable: true })
  waveformData: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.audioFiles)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transcription, transcription => transcription.audioFile)
  transcriptions: Transcription[];
}