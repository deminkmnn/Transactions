import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 16, unique: true })
  cardNumber: string;

  @Column({ default: 'My Card' })
  alias: string;

  @Column({ default: 'personal' })
  type: string;

  @Column({ nullable: true, select: false })
  apiToken: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ default: 'UAH' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (tx) => tx.account)
  transactions: Transaction[];
}
