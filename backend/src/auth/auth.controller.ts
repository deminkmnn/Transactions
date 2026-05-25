import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtRefreshGuard, JwtAuthGuard, CurrentUser } from './auth.guard';

class AuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthDto) {
    return this.svc.register(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AuthDto) {
    return this.svc.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  refresh(@CurrentUser() user: { id: string; email: string }) {
    return this.svc.refresh(user.id, user.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { id: string }) {
    return this.svc.logout(user.id);
  }
}
