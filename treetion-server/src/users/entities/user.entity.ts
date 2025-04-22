// src/users/entities/user.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
  import { Exclude } from 'class-transformer';
  import { SocialProvider } from '../../auth/dto';
  import { AudioFile } from '../../audio/entities/audio-file.entity';
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ nullable: true })
    name: string;
  
    @Column({ nullable: true })
    firstName: string;
  
    @Column({ nullable: true })
    lastName: string;
  
    @Column({ nullable: true })
    profilePicture: string;
  
    @Column({
      type: 'enum',
      enum: SocialProvider,
    })
    provider: SocialProvider;
  
    @Column()
    providerId: string;
  
    @Column({ default: false })
    isEmailVerified: boolean;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
    
    @OneToMany(() => AudioFile, audioFile => audioFile.user)
    audioFiles: AudioFile[];
  
    // 필요한 관계 정의 (예: 사용자가 갖는 오디오 파일, 트리 등)
    // @OneToMany(() => Audio, audio => audio.user)
    // audios: Audio[];
    
    // @OneToMany(() => Tree, tree => tree.user)
    // trees: Tree[];
  }