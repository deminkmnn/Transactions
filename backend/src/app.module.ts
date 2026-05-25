import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrivatbankModule } from './privatbank/privatbank.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => {
        const isDevelopment = cfg.get('NODE_ENV') !== 'production';

        return {
          type: 'postgres' as const,
          host: cfg.get<string>('DB_HOST') ?? 'localhost',
          port: Number(cfg.get<string>('DB_PORT') ?? 5432),
          username: cfg.get<string>('DB_USER') ?? 'myuser',
          password: cfg.get<string>('DB_PASSWORD') ?? 'mypassword',
          database: cfg.get<string>('DB_NAME') ?? 'transactions_db',
          autoLoadEntities: true,
          synchronize: true,
          logging: isDevelopment,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    PrivatbankModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
