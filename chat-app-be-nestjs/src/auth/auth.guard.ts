import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Reflector } from "@nestjs/core";
import { SKIP_AUTH_GUARD } from "../core/decorators/skipauth.decorator";
import { AuthRequest } from "../core/request/auth";
import { Socket } from "socket.io";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipped = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_GUARD, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipped) {
      return true;
    }

    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>()
    const token = client.handshake.headers.authorization;
    if (!token) {
      throw new WsException({status: 'AUTH_ERROR', message: 'missing token'});
    }

    try {
      client['authenticatedUser'] = await this.authService.verifyToken(token);
    } catch {
      throw new WsException({status: 'AUTH_ERROR', message: 'invalid token'});
    }

    return true;
  }
}
