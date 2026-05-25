import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

const DEFAULT_JWT_REFRESH_SECRET = 'dev-refresh-secret';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(cfg: ConfigService, private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: cfg.get('JWT_REFRESH_SECRET') ?? DEFAULT_JWT_REFRESH_SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();

    const user = await this.users.findByIdWithRefreshToken(payload.sub);
    if (!user?.refreshTokenHash) throw new UnauthorizedException();

    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) throw new UnauthorizedException('Refresh token mismatch');

    return { id: user.id, email: user.email };
  }
}
