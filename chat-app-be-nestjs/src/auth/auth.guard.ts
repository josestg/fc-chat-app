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

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthRequest>();

    const [kind, token] = request.headers.authorization?.split(' ') ?? ['', ''];
    if (kind.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Unexpected token kind.');
    }

    if (!token) {
      throw new UnauthorizedException('Missing token.');
    }

    try {
      request.authenticatedUser = await this.authService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }

    return true;
  }
}
