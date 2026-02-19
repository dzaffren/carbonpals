import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  generateToken(userId: string): string {
    return this.jwtService.sign({ userId, sub: userId });
  }

  async validateUser(token: string) {
    try {
      // In mock mode, extract userId from token and return user object
      if (this.dbService.isUsingMock()) {
        // Decode JWT to get userId
        try {
          const decoded = this.jwtService.verify(token);
          return { 
            id: decoded.userId,
            email: `${decoded.userId}@example.com`,
            aud: 'authenticated'
          };
        } catch {
          // Fallback to test user for old mock tokens
          const userId = 'test-user-001';
          return { 
            id: userId,
            email: `${userId}@example.com`,
            aud: 'authenticated'
          };
        }
      }
      
      const { data, error } = await this.dbService.db.auth.getUser(token);
      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.dbService.db
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createUserProfile(userId: string, userData: any) {
    const { data, error } = await this.dbService.db
      .from('users')
      .insert([{ id: userId, ...userData }])
      .single();
    
    if (error) throw error;
    return data;
  }
}
