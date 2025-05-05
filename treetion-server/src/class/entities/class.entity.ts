// src/class/entities/class.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AudioEntity } from '../../audio/entities/audio.entity';

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => AudioEntity, audio => audio.class)
  audios: AudioEntity[];
}