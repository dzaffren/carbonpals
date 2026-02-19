import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; username: string },
  ) {
    const { email, password, username } = body;

    // Check if user already exists
    const existingUsers = await this.databaseService.db
      .from('users')
      .select()
      .eq('username', username)
      .async();

    if (existingUsers.data && existingUsers.data.length > 0) {
      throw new Error('Username already taken');
    }

    const existingEmails = await this.databaseService.db
      .from('users')
      .select()
      .eq('email', email)
      .async();

    if (existingEmails.data && existingEmails.data.length > 0) {
      throw new Error('Email already registered');
    }

    // Create user with simple UUID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.databaseService.db.from('users').insert([
      {
        id: userId,
        username,
        email,
        display_name: username,
        created_at: new Date().toISOString(),
      },
    ]);

    // Generate JWT token
    const token = this.authService.generateToken(userId);

    return {
      user: {
        id: userId,
        email,
        username,
        display_name: username,
      },
      token,
    };
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email } = body;

    // Find user by email
    const result = await this.databaseService.db
      .from('users')
      .select()
      .eq('email', email)
      .async();

    if (!result.data || result.data.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.data[0];

    // Generate JWT token
    const token = this.authService.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
      token,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId = req.user.userId;

    const result = await this.databaseService.db
      .from('users')
      .select()
      .eq('id', userId)
      .single();

    if (!result.data) {
      throw new Error('User not found');
    }

    return {
      id: result.data.id,
      email: result.data.email,
      username: result.data.username,
      display_name: result.data.display_name,
      avatar_url: result.data.avatar_url,
    };
  }
}
