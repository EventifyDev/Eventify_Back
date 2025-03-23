import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();

      if (!client.data?.userId) {
        this.logger.warn(
          `WebSocket authentication failed: No userId in socket data`,
        );
        throw new WsException('Unauthorized');
      }

      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error.message}`);
      throw new WsException('Unauthorized');
    }
  }

  async verifyToken(
    client: Socket,
  ): Promise<{ userId: string; [key: string]: any } | null> {
    try {
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      });

      return payload;
    } catch (error) {
      this.logger.error(`JWT verification failed: ${error.message}`);
      return null;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    return token || null;
  }
}
