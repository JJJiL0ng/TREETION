// src/audio/entities/usage-stats.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('usage_stats')
export class UsageStats {
  @PrimaryGeneratedColumn('uuid')
  statsId: string;

  @Column()
  userId: string;

  @Column()
  date: Date;

  @Column('int', { default: 0 })
  transcriptionSeconds: number;

  @Column('bigint', { default: 0 })
  uploadedBytes: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}