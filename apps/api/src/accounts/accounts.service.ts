import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Transaction } from '../transactions/transaction.schema';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { Account, AccountDocument } from './account.schema';

export interface AccountResponse {
  id: string;
  name: string;
  type: Account['type'];
  currency: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(userId: string, input: CreateAccountDto): Promise<AccountResponse> {
    const account = await this.accountModel.create({
      userId: new Types.ObjectId(userId),
      name: input.name,
      type: input.type,
      currency: input.currency,
    });
    return toAccountResponse(account);
  }

  async list(userId: string): Promise<AccountResponse[]> {
    const accounts = await this.accountModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
    return accounts.map(toAccountResponse);
  }

  async get(userId: string, accountId: string): Promise<AccountResponse> {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new NotFoundException('Account not found.');
    }
    const account = await this.accountModel
      .findOne({ _id: accountId, userId: new Types.ObjectId(userId) })
      .exec();
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    return toAccountResponse(account);
  }

  async update(
    userId: string,
    accountId: string,
    input: UpdateAccountDto,
  ): Promise<AccountResponse> {
    if (!Object.keys(input).length) {
      throw new BadRequestException('Provide at least one account field to update.');
    }
    if (!Types.ObjectId.isValid(accountId)) {
      throw new NotFoundException('Account not found.');
    }
    const changes: Partial<Account> = {};
    if (input.name !== undefined) changes.name = input.name;
    if (input.type !== undefined) changes.type = input.type;
    if (input.currency !== undefined) changes.currency = input.currency;
    const account = await this.accountModel
      .findOneAndUpdate(
        { _id: accountId, userId: new Types.ObjectId(userId) },
        { $set: changes },
        { new: true, runValidators: true },
      )
      .exec();
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    return toAccountResponse(account);
  }

  async remove(userId: string, accountId: string): Promise<void> {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new NotFoundException('Account not found.');
    }
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const ownedAccount = await this.accountModel
          .findOne({ _id: accountId, userId: new Types.ObjectId(userId) })
          .select('+transactionCount')
          .session(session)
          .exec();
        if (!ownedAccount) {
          throw new NotFoundException('Account not found.');
        }

        const transactionExists = await this.transactionModel
          .exists({
            accountId: ownedAccount._id,
            userId: new Types.ObjectId(userId),
          })
          .session(session);
        if (transactionExists || ownedAccount.transactionCount > 0) {
          throw new ConflictException(
            'Delete or move this account’s transactions before deleting the account.',
          );
        }
        const deletedAccount = await this.accountModel
          .findOneAndDelete({
            _id: accountId,
            userId: new Types.ObjectId(userId),
            transactionCount: 0,
          })
          .session(session)
          .exec();
        if (!deletedAccount) {
          throw new InternalServerErrorException(
            'Unable to delete this account because its transaction state is inconsistent.',
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }
}

function toAccountResponse(account: AccountDocument): AccountResponse {
  return {
    id: account._id.toString(),
    name: account.name,
    type: account.type,
    currency: account.currency,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
