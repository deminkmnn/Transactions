import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { PrivatbankService } from './privatbank.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('privatbank')
export class PrivatbankController {
  constructor(private readonly svc: PrivatbankService) {}

  @Post('sync')
  sync(@Query('days') days: string | undefined, @CurrentUser() user: { id: string }) {
    const daysBack = Math.min(Math.max(Number(days) || 1, 1), 365);
    return this.svc.syncForUser(user.id, daysBack);
  }
}
