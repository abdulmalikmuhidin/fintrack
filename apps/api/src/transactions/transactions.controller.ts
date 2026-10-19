import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TrustedOriginGuard } from '../auth/guards/trusted-origin.guard';
import { PublicUser } from '../users/user.types';
import {
  CreateTransactionDto,
  TransactionQueryDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import {
  TransactionPage,
  TransactionResponse,
  TransactionsService,
} from './transactions.service';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  async create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateTransactionDto,
  ): Promise<{ transaction: TransactionResponse }> {
    return { transaction: await this.transactionsService.create(user.id, input) };
  }

  @Get()
  async list(
    @CurrentUser() user: PublicUser,
    @Query() query: TransactionQueryDto,
  ): Promise<TransactionPage> {
    return this.transactionsService.list(user.id, query);
  }

  @Get(':id')
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id') transactionId: string,
  ): Promise<{ transaction: TransactionResponse }> {
    return {
      transaction: await this.transactionsService.get(user.id, transactionId),
    };
  }

  @Patch(':id')
  @UseGuards(TrustedOriginGuard)
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id') transactionId: string,
    @Body() input: UpdateTransactionDto,
  ): Promise<{ transaction: TransactionResponse }> {
    return {
      transaction: await this.transactionsService.update(
        user.id,
        transactionId,
        input,
      ),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id') transactionId: string,
  ): Promise<void> {
    await this.transactionsService.remove(user.id, transactionId);
  }
}
