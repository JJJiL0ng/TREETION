// src/class/class.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClassEntity } from './entities/class.entity';
import { AudioEntity } from '../audio/entities/audio.entity';
import { CreateClassDto, UpdateClassDto, UpdateClassOrderDto } from './dto/class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassEntity)
    private classRepository: Repository<ClassEntity>,
    @InjectRepository(AudioEntity)
    private audioRepository: Repository<AudioEntity>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, createClassDto: CreateClassDto): Promise<ClassEntity> {
    // 현재 사용자의 클래스 중 가장 높은 order 값을 찾음
    const highestOrderClass = await this.classRepository.findOne({
      where: { userId },
      order: { order: 'DESC' },
    });

    const newOrder = highestOrderClass ? highestOrderClass.order + 1 : 0;

    const newClass = this.classRepository.create({
      ...createClassDto,
      userId,
      order: newOrder,
    });

    return this.classRepository.save(newClass);
  }

  async findAll(userId: string): Promise<ClassEntity[]> {
    return this.classRepository.find({
      where: { userId },
      order: { order: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ClassEntity> {
    const classEntity = await this.classRepository.findOne({
      where: { id, userId },
      relations: ['audios'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(id: string, userId: string, updateClassDto: UpdateClassDto): Promise<ClassEntity> {
    const classEntity = await this.findOne(id, userId);
    
    const updatedClass = Object.assign(classEntity, updateClassDto);
    return this.classRepository.save(updatedClass);
  }

  async remove(id: string, userId: string): Promise<void> {
    const classEntity = await this.findOne(id, userId);
    
    await this.dataSource.transaction(async manager => {
      // 해당 클래스의 모든 오디오를 찾아서 classId를 null로 설정
      await manager.update(
        AudioEntity,
        { classId: id, userId },
        { classId: null as any }
      );
      
      // 클래스 삭제
      await manager.remove(classEntity);
    });
  }

  async updateOrder(userId: string, updateOrderDto: UpdateClassOrderDto): Promise<ClassEntity[]> {
    const { classIds } = updateOrderDto;

    // 존재하는 모든 클래스를 가져옴
    const existingClasses = await this.classRepository.find({
      where: { userId },
    });

    // 입력된 ID가 모두 사용자의 클래스 ID인지 확인
    const existingClassIds = existingClasses.map(c => c.id);
    const allIdsExist = classIds.every(id => existingClassIds.includes(id));

    if (!allIdsExist) {
      throw new BadRequestException('One or more class IDs do not exist or do not belong to this user');
    }

    // 중복된 ID가 없는지 확인
    const uniqueIds = new Set(classIds);
    if (uniqueIds.size !== classIds.length) {
      throw new BadRequestException('Duplicate class IDs are not allowed');
    }

    // 트랜잭션으로 일괄 업데이트
    await this.dataSource.transaction(async manager => {
      for (let i = 0; i < classIds.length; i++) {
        await manager.update(
          ClassEntity,
          { id: classIds[i], userId },
          { order: i }
        );
      }
      
      // 누락된 ID의 클래스들은 가장 마지막 순서로 설정
      const missingIds = existingClassIds.filter(id => !classIds.includes(id));
      let lastOrder = classIds.length;
      
      for (const id of missingIds) {
        await manager.update(
          ClassEntity,
          { id, userId },
          { order: lastOrder++ }
        );
      }
    });
    
    // 업데이트된 순서로 클래스 반환
    return this.findAll(userId);
  }

  // 오디오 관련 메서드 추가
  async addAudioToClass(audioId: string, classId: string, userId: string): Promise<AudioEntity> {
    const audio = await this.audioRepository.findOne({ 
      where: { id: audioId, userId } 
    });
    
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found or does not belong to user`);
    }

    const classEntity = await this.classRepository.findOne({ 
      where: { id: classId, userId } 
    });
    
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found or does not belong to user`);
    }

    audio.classId = classId;
    return this.audioRepository.save(audio);
  }

  async removeAudioFromClass(audioId: string, userId: string): Promise<AudioEntity> {
    const audio = await this.audioRepository.findOne({ 
      where: { id: audioId, userId } 
    });
    
    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found or does not belong to user`);
    }

    audio.classId = null as any;
    return this.audioRepository.save(audio);
  }

  async findAllAudiosByClass(classId: string, userId: string): Promise<AudioEntity[]> {
    // 클래스가 해당 사용자의 것인지 확인
    const classEntity = await this.classRepository.findOne({ 
      where: { id: classId, userId } 
    });
    
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found or does not belong to user`);
    }

    return this.audioRepository.find({
      where: { classId, userId },
      order: { createdAt: 'DESC' }
    });
  }
}