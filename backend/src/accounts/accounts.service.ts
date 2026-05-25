import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

export interface CreateAccountDto {
  cardNumber: string;
  alias?: string;
  type?: string;
  apiToken?: string;
}

export interface UpdateAccountDto {
  alias?: string;
  isActive?: boolean;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
  ) {}

  async findAll(userId: string): Promise<Account[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const acc = await this.repo.findOne({ where: { id, userId } });
    if (!acc) throw new NotFoundException(`Account not found`);
    return acc;
  }

  async findByCard(cardNumber: string, userId: string): Promise<Account | null> {
    return this.repo.findOne({ where: { cardNumber, userId } });
  }

  async findAllWithToken(userId: string): Promise<Account[]> {
    return this.repo
      .createQueryBuilder('a')
      .addSelect('a.apiToken')
      .where('a.userId = :userId AND a.isActive = true', { userId })
      .getMany();
  }

  // Для cron-синку — всі активні акаунти всіх юзерів
  async findAllActiveWithToken(): Promise<Account[]> {
    return this.repo
      .createQueryBuilder('a')
      .addSelect('a.apiToken')
      .where('a.isActive = true AND a.apiToken IS NOT NULL')
      .getMany();
  }

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    const card = dto.cardNumber.replace(/\s/g, '');
    if (card.length !== 16) throw new BadRequestException('Card number must be 16 digits');

    const existing = await this.repo.findOne({ where: { cardNumber: card } });
    if (existing) {
      if (existing.userId === userId) {
        throw new BadRequestException('This card is already added');
      }

      throw new BadRequestException('This card is already linked to another account');
    }

    const acc = this.repo.create({
      cardNumber: card,
      alias: dto.alias ?? 'My Card',
      type: dto.type ?? 'personal',
      apiToken: dto.apiToken ?? null,
      userId,
    });
    return this.repo.save(acc);
  }

  async update(id: string, userId: string, dto: UpdateAccountDto): Promise<Account> {
    const acc = await this.findOne(id, userId);
    Object.assign(acc, dto);
    return this.repo.save(acc);
  }

  async updateBalance(cardNumber: string, balance: number): Promise<void> {
    await this.repo.update({ cardNumber }, { balance, lastSyncAt: new Date() });
  }

  // === ВИПРАВЛЕНИЙ МЕТОД ===
  async refreshBalance(id: string, userId: string): Promise<Account> {
    const acc = await this.findOne(id, userId);
    
    // Шукаємо найостаннішу транзакцію (за датою) саме для цієї картки
    const lastTx = await this.repo.manager.query(
      `SELECT balance FROM transactions WHERE "cardNumber" = $1 ORDER BY "transactionDate" DESC LIMIT 1`,
      [acc.cardNumber]
    );

    // Якщо знайшли транзакцію і там є баланс, оновлюємо картку
    if (lastTx && lastTx.length > 0 && lastTx[0].balance !== null) {
      acc.balance = Number(lastTx[0].balance);
      acc.lastSyncAt = new Date();
      await this.repo.save(acc);
    }

    return acc;
  }
  // ==========================

  async remove(id: string, userId: string): Promise<void> {
    const acc = await this.findOne(id, userId);
    await this.repo.remove(acc);
  }
}