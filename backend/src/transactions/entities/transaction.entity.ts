import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export type TransactionType = 'debit' | 'credit';
export type TransactionCategory =
  | 'food' | 'transport' | 'entertainment' | 'health'
  | 'utilities' | 'shopping' | 'income' | 'transfer'
  | 'cafe' | 'fuel' | 'education' | 'travel' | 'other';

@Entity('transactions')
@Index(['cardNumber', 'transactionDate'])
@Index(['externalId'], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 16 })
  cardNumber: string;

  // Унікальний ID з боку Приватбанку — для уникнення дублів
  @Column({ unique: true })
  externalId: string;

  @Column({ type: 'varchar', length: 10 })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'UAH' })
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 50, default: 'other' })
  category: TransactionCategory;

  // Явно вказуємо тип 'int', щоб уникнути помилок TypeORM
  @Column({ type: 'int', nullable: true })
  mcc: number | null;

  @Column({ type: 'boolean', default: false })
  categoryEditedByUser: boolean;

  @Column({ type: 'timestamptz' })
  transactionDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Account, (a) => a.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cardNumber', referencedColumnName: 'cardNumber' })
  account: Account;
}
