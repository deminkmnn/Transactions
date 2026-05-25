import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
import { categorizeByMcc } from '../common/mcc.util';

interface PrivatStatement {
  appcode: string;
  trandate: string;
  trantime: string;
  cardamount: string;
  reste: string;
  description: string;
  terminal: string;
  mcc?: string;
}

interface PrivatResponse {
  status: string;
  data: PrivatStatement[];
}

@Injectable()
export class PrivatbankService {
  private readonly logger = new Logger(PrivatbankService.name);
  private readonly BASE_URL = 'https://acp.privatbank.ua/api/statements';

  constructor(
    private readonly cfg: ConfigService,
    private readonly accounts: AccountsService,
    private readonly transactions: TransactionsService,
  ) {}

  // Ручний синк для конкретного юзера (з контролера)
  async syncForUser(userId: string, daysBack = 1): Promise<{ synced: number; daysBack: number }> {
    const userAccounts = await this.accounts.findAllWithToken(userId);
    return this.syncAccounts(userAccounts, daysBack);
  }

  // Cron-синк — всі активні акаунти всіх юзерів
  @Cron('0 8 * * *')
  async scheduledSync() {
    this.logger.log('⏰ Scheduled daily sync started');
    const allAccounts = await this.accounts.findAllActiveWithToken();
    const result = await this.syncAccounts(allAccounts, 1);
    this.logger.log(`⏰ Done: ${result.synced} new transactions`);
  }

  private async syncAccounts(accs: any[], daysBack: number): Promise<{ synced: number; daysBack: number }> {
    if (!accs.length) return { synced: 0, daysBack };

    let totalSynced = 0;
    for (const account of accs) {
      if (!account.apiToken) continue;
      try {
        const count = await this.syncAccount(account.cardNumber, account.apiToken, daysBack);
        totalSynced += count;
        this.logger.log(`Synced ${count} txs for ••••${account.cardNumber.slice(-4)}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown sync error';
        this.logger.error(`Sync failed for ••••${account.cardNumber.slice(-4)}: ${message}`);
      }
    }
    return { synced: totalSynced, daysBack };
  }

  private async syncAccount(cardNumber: string, apiToken: string, daysBack: number): Promise<number> {
    const statements = await this.fetchStatements(cardNumber, apiToken, daysBack);
    const dtos = statements.map((s) => this.mapStatement(cardNumber, s));
    const synced = await this.transactions.upsertMany(dtos);

    if (statements.length > 0) {
      const { amount } = this.parseAmount(statements[0].reste);
      await this.accounts.updateBalance(cardNumber, amount);
    }
    return synced;
  }

  private async fetchStatements(cardNumber: string, apiToken: string, daysBack: number): Promise<PrivatStatement[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

    const [id, token] = apiToken.split(':');

    const { data } = await axios.get<PrivatResponse>(`${this.BASE_URL}/transactions`, {
      headers: { id, token, 'Content-Type': 'application/json' },
      params: { acc: cardNumber, startDate: fmt(startDate), endDate: fmt(endDate) },
      timeout: 15_000,
    });

    if (data.status !== 'OK') throw new BadRequestException(`PrivatBank API: ${data.status}`);
    return data.data ?? [];
  }

  private mapStatement(cardNumber: string, s: PrivatStatement) {
    const { amount, currency } = this.parseAmount(s.cardamount);
    const { amount: balanceAmount } = this.parseAmount(s.reste);
    const mcc = s.mcc ? parseInt(s.mcc, 10) : null;
    const [d, m, y] = s.trandate.split('.');
    const transactionDate = new Date(`${y}-${m}-${d}T${s.trantime}`);

    return {
      cardNumber,
      externalId: `${cardNumber}_${s.appcode}_${s.trandate}_${s.trantime}`,
      type: amount >= 0 ? ('credit' as const) : ('debit' as const),
      amount: Math.abs(amount),
      currency,
      balance: balanceAmount,
      description: s.description || s.terminal || 'Транзакція',
      mcc,
      category: categorizeByMcc(mcc, s.description),
      transactionDate,
    };
  }

  private parseAmount(raw: string): { amount: number; currency: string } {
    const cleaned = raw.replace(/\s/g, '');
    const match = cleaned.match(/^([+-]?\d+\.?\d*)([A-Z]{3})$/);
    if (!match) return { amount: 0, currency: 'UAH' };
    return { amount: parseFloat(match[1]), currency: match[2] };
  }
}
