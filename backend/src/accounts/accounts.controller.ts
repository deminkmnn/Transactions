import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { AccountsService, CreateAccountDto, UpdateAccountDto } from './accounts.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly svc: AccountsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateAccountDto, @CurrentUser() user: { id: string }) {
    return this.svc.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.update(id, user.id, dto);
  }

  @Post(':id/refresh-balance')
  refreshBalance(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.refreshBalance(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.remove(id, user.id);
  }
}
