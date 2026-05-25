import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService, TransactionQuery } from './transactions.service';
import { TransactionCategory } from './entities/transaction.entity';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @Get()
  findAll(@Query() query: TransactionQuery, @CurrentUser() user: { id: string }) {
    return this.svc.findAll(query, user.id);
  }

  @Get('balance')
  getBalance(@Query('cardNumber') cardNumber: string | undefined, @CurrentUser() user: { id: string }) {
    return this.svc.getBalance(user.id, cardNumber);
  }

  @Get('stats/monthly/:year/:month')
  getMonthlyStats(
    @Param('year') year: string,
    @Param('month') month: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.getMonthlyStats(Number(year), Number(month), user.id);
  }

  @Get('stats/yearly/:year')
  getYearlyStats(@Param('year') year: string, @CurrentUser() user: { id: string }) {
    return this.svc.getYearlyStats(Number(year), user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.findOne(id, user.id);
  }

  @Patch(':id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: { category: TransactionCategory; note?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.svc.updateCategory(id, body.category, body.note, user.id);
  }

  @Post('import/pdf/preview/:accountId')
  @UseInterceptors(FileInterceptor('file'))
  previewPdfImport(
    @Param('accountId') accountId: string,
    @UploadedFile() file: { originalname?: string; buffer?: Buffer; mimetype?: string } | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!file?.buffer) throw new BadRequestException('PDF file is required');
    return this.svc.previewPdfImport(accountId, file.originalname ?? 'statement.pdf', file.buffer, user.id);
  }

  @Post('import/pdf/:accountId')
  @UseInterceptors(FileInterceptor('file'))
  importPdf(
    @Param('accountId') accountId: string,
    @UploadedFile() file: { originalname?: string; buffer?: Buffer; mimetype?: string } | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!file?.buffer) throw new BadRequestException('PDF file is required');
    return this.svc.importPdf(accountId, file.originalname ?? 'statement.pdf', file.buffer, user.id);
  }
}
