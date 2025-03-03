import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/providers/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractTokenFromHeader(req);

      console.log('Token:', token);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

<<<<<<< Updated upstream
      console.log('Payload:', payload);

      const user = await this.userService.getUserById(payload.sub);
=======
      const user = await this.userService.getUser(payload.sub);
>>>>>>> Stashed changes
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      console.log('User:', user);

      req['user'] = user;
      next();
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
