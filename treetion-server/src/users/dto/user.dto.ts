// src/users/dto/user.dto.ts
import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  profilePicture: string;

  @Expose()
  isEmailVerified: boolean;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}

