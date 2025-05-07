// src/audio/entities/audio.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audios')
export class AudioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  audioUrl: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  audioKey: string;

  @Column({ type: 'timestamp' })
  recordedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 기존 STT 필드
  @Column({ nullable: true })
  transcriptionText: string;

  @Column({ nullable: true })
  transcriptionKey: string;

  @Column({ nullable: true })
  transcriptionUrl: string;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @Column({ nullable: true })
  language: string;

  // 업그레이드된 STT 필드
  @Column({ nullable: true, type: 'text' })
  upgradedText: string;

  @Column({ nullable: true })
  upgradedTextKey: string;

  @Column({ nullable: true })
  upgradedTextUrl: string;

  @Column({ type: 'boolean', default: false })
  isUpgraded: boolean;

  @Column({ type: 'timestamp', nullable: true })
  upgradedAt: Date;

  // 원본 파일명 (청크 관리 및 파일명 생성 시 사용)
  @Column({ nullable: true })
  originalFilename: string;
  // 업그레이드 개선율
  @Column({ type: 'float', nullable: true })
  improvedPercentage: number;

  // 처리 상태 추적
  @Column({ type: 'varchar', default: 'pending' })
  processingStatus: string; // 'pending', 'processing', 'completed', 'failed'

  // 처리 오류 정보 (실패 시)
  @Column({ type: 'text', nullable: true })
  processingError: string;
}