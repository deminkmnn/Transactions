import {
  Injectable, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

const SALT_ROUNDS = 10;
const DEFAULT_JWT_ACCESS_SECRET = 'dev-access-secret';
const DEFAULT_JWT_REFRESH_SECRET = 'dev-refresh-secret';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.users.create(email, passwordHash);

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, email: string) {
    // Юзер вже валідований в JwtRefreshStrategy
    const tokens = await this.issueTokens(userId, email);
    await this.saveRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.users.setRefreshToken(userId, null);
    return { success: true };
  }

  // ─── Приватні хелпери ────────────────────────────────────────────────────────

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.cfg.get('JWT_ACCESS_SECRET') ?? DEFAULT_JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.cfg.get('JWT_REFRESH_SECRET') ?? DEFAULT_JWT_REFRESH_SECRET,
        expiresIn: '30d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hash = await bcrypt.hash(token, SALT_ROUNDS);
    await this.users.setRefreshToken(userId, hash);
  }
}
