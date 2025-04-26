// src/audio/entities/audio.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity('audios')
  export class Audio {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    filename: string;
  
    @Column()
    originalName: string;
  
    @Column()
    path: string;
  
    @Column()
    size: number;
  
    @Column()
    mimeType: string;
  
    @Column()
    url: string;
  
    @Column({ nullable: true })
    title: string;
  
    @Column({ nullable: true })
    audioFileType: string;
  
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @Column({ type: 'uuid' })
    userId: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }