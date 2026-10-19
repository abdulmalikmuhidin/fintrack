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
import { AccountResponse, AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @UseGuards(TrustedOriginGuard)
  async create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreateAccountDto,
  ): Promise<{ account: AccountResponse }> {
    return { account: await this.accountsService.create(user.id, input) };
  }

  @Get()
  async list(@CurrentUser() user: PublicUser): Promise<{ items: AccountResponse[] }> {
    return { items: await this.accountsService.list(user.id) };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: PublicUser,
    @Param('id') accountId: string,
  ): Promise<{ account: AccountResponse }> {
    return { account: await this.accountsService.get(user.id, accountId) };
  }

  @Patch(':id')
  @UseGuards(TrustedOriginGuard)
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
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('id') accountId: string,
  ): Promise<void> {
    await this.accountsService.remove(user.id, accountId);
  }
}
