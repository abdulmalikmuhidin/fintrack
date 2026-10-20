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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TrustedOriginGuard } from '../auth/guards/trusted-origin.guard';
import { PublicUser } from '../users/user.types';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccountResponse, AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Accounts')
@ApiCookieAuth('fintrack_session')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Create an account for the authenticated user' })
  @ApiCreatedResponse({ description: 'Account created; response omits ownership fields.' })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  async create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateAccountDto,
  ): Promise<{ account: AccountResponse }> {
    return { account: await this.accountsService.create(user.id, input) };
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user’s accounts' })
  @ApiOkResponse({ description: 'Owned accounts, newest first.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  async list(@CurrentUser() user: PublicUser): Promise<{ items: AccountResponse[] }> {
    return { items: await this.accountsService.list(user.id) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one owned account' })
  @ApiOkResponse({ description: 'Owned account.' })
  @ApiNotFoundResponse({ description: 'Account is missing or not owned by the user.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id') accountId: string,
  ): Promise<{ account: AccountResponse }> {
    return { account: await this.accountsService.get(user.id, accountId) };
  }

  @Patch(':id')
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Update an owned account' })
  @ApiOkResponse({ description: 'Updated account.' })
  @ApiBadRequestResponse({ description: 'Input validation failed.' })
  @ApiNotFoundResponse({ description: 'Account is missing or not owned by the user.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id') accountId: string,
    @Body() input: UpdateAccountDto,
  ): Promise<{ account: AccountResponse }> {
    return {
      account: await this.accountsService.update(user.id, accountId, input),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TrustedOriginGuard)
  @ApiOperation({ summary: 'Delete an owned account with no transactions' })
  @ApiForbiddenResponse({ description: 'Request origin is not allowed.' })
  @ApiNotFoundResponse({ description: 'Account is missing or not owned by the user.' })
  @ApiConflictResponse({ description: 'Account has transactions and cannot be deleted.' })
  @ApiNoContentResponse({ description: 'Account deleted.' })
  @ApiUnauthorizedResponse({ description: 'Session is missing, invalid, or expired.' })
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id') accountId: string,
  ): Promise<void> {
    await this.accountsService.remove(user.id, accountId);
  }
}
