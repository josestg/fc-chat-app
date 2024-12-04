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
import { AuthSocket } from "../core/socket/auth";

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
    const socket = wsContext.getClient<AuthSocket>()

    const { token } = socket.handshake.auth;
    if (!token) {
      throw new WsException({ code: "AUTH_ERROR", message: "Missing token." });
    }

    try {
      socket.authenticatedUser = await this.authService.verifyToken(token);
    } catch (ex) {
      console.log(ex)
      throw new WsException({ code: "AUTH_ERROR", message: "Invalid token." });
    }

    return true;
  }
}
