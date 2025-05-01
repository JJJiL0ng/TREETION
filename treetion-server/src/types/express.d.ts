import { UserDto } from '../users/dto/user.dto';

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        id: string;
      } & Partial<UserDto>;
    }
  }
} 