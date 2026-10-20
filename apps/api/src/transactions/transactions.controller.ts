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
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
@ApiTags('Transactions')
@ApiCookieAuth('fintrack_session')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Create a transaction for an owned account' })
  @ApiCreatedResponse({ description: 'Created transaction with integer minor-unit amount.' })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiNotFoundResponse({ description: 'Account is missing or not owned by the user.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  async create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateTransactionDto,
  ): Promise<{ transaction: TransactionResponse }> {
    return { transaction: await this.transactionsService.create(user.id, input) };
  }

  @Get()
  @ApiOperation({ summary: 'List owned transactions with filters and pagination' })
  @ApiQuery({ type: TransactionQueryDto })
  @ApiOkResponse({
    description: 'Paginated transactions. Amounts are integer minor units and include currency.',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Query validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  async list(
    @CurrentUser() user: PublicUser,
    @Query() query: TransactionQueryDto,
  ): Promise<TransactionPage> {
    return this.transactionsService.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned transaction' })
  @ApiOkResponse({ description: 'Owned transaction.' })
  @ApiNotFoundResponse({ description: 'Transaction is missing or not owned by the user.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
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
  @ApiOperation({ summary: 'Update an owned transaction' })
  @ApiOkResponse({ description: 'Updated transaction.' })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiNotFoundResponse({ description: 'Transaction or target account is missing or not owned.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
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
  @ApiOperation({ summary: 'Delete an owned transaction' })
  @ApiNoContentResponse({ description: 'Transaction deleted.' })
  @ApiNotFoundResponse({ description: 'Transaction is missing or not owned by the user.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id') transactionId: string,
  ): Promise<void> {
    await this.transactionsService.remove(user.id, transactionId);
  }
}
