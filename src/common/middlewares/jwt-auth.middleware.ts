import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token =
      this.extractTokenFromCookies(req) || this.extractTokenFromHeader(req);

    if (!token) {
      return next();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      req.user = payload;
    } catch (e) {
      this.clearInvalidCookies(res);
    }

    next();
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromCookies(req: Request): string | undefined {
    return req.cookies?.Authentication;
  }

  private clearInvalidCookies(res: Response) {
    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: true,
    });
    res.clearCookie('Refresh', {
      httpOnly: true,
      secure: true,
    });
  }
}
