export interface User {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }