import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '..', '.env.local'),
        resolve(__dirname, '..', '.env'),
        resolve(process.cwd(), 'apps', 'api', '.env.local'),
        resolve(process.cwd(), 'apps', 'api', '.env'),
        resolve(process.cwd(), '.env.local'),
        resolve(process.cwd(), '.env'),
      ],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AccountsModule,
    TransactionsModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }