// src/audio/entities/chunk-upload.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chunk_uploads')
export class ChunkUpload {
  @PrimaryGeneratedColumn('uuid')
  uploadId: string;

  @Column()
  userId: string;

  @Column()
  fileName: string;

  @Column('int')
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column('int')
  chunkSize: number;

  @Column('json')
  chunks: Record<number, { received: boolean; timestamp: Date }>;

  @Column('timestamp')
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}