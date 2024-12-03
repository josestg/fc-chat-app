import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { TokenDto } from './dto/token.dto';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { UserLoggedDto } from '../users/dto/user-logged.dto';
import { ConfigService } from '@nestjs/config';
import { JWTConfig } from "../config/config";

@Injectable()
export class AuthService {
  private readonly jwtVerifyOption: JwtVerifyOptions;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const jwtConfig = configService.get<JWTConfig>('jwt');
    this.jwtVerifyOption = {
      secret: jwtConfig.secret,
      algorithms: [jwtConfig.algorithm],
      audience: jwtConfig.audience,
      issuer: jwtConfig.issuer,
    };
  }

  async genToken(usr: User): Promise<TokenDto> {
    const payload = {
      jwtid: randomUUID(),
      sub: usr.id,
      name: usr.name,
      email: usr.email,
    };

    return {
      kind: 'Bearer',
      token: await this.jwtService.signAsync(payload),
    };
  }

  async verifyToken(token: string): Promise<UserLoggedDto> {
    const payload = await this.jwtService.verifyAsync(token, this.jwtVerifyOption);
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
    };
  }
}
