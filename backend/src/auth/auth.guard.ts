import {
  Injectable, ExecutionContext, UnauthorizedException, createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
