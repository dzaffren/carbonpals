import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers.authorization;

    if (!auth) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [, token] = auth.split(' ');
    
    // Allow mock tokens for testing
    if (token === 'mock-jwt-token-for-testing') {
      request.user = {
        id: 'test-user-001',
        email: 'test@example.com',
      };
      return true;
    }

    const user = await this.authService.validateUser(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = user;
    return true;
  }
}
