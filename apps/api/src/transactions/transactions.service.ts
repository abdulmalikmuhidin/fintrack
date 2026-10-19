import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model, Types } from 'mongoose';
import { Account } from '../accounts/account.schema';
import { CreateTransactionDto, TransactionQueryDto, UpdateTransactionDto } from './dto/transaction.dto';
import { Transaction, TransactionDocument } from './transaction.schema';

export interface TransactionResponse {
  id: string;
  accountId: string;
  type: Transaction['type'];
  amountMinor: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPage {
  items: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const MAX_AMOUNT_MINOR = 100_000_000_000;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(userId: string, input: CreateTransactionDto): Promise<TransactionResponse> {
    const amountMinor = validateAmount(input.amountMinor);
    const session = await this.connection.startSession();
    let created: TransactionDocument | undefined;
    try {
      await session.withTransaction(async () => {
        const account = await this.accountModel
          .findOne({ _id: input.accountId, userId: new Types.ObjectId(userId) })
          .session(session)
          .exec();
        if (!account) throw new NotFoundException('Account not found.');

        const claimed = await this.accountModel
          .updateOne(
            { _id: account._id, userId: new Types.ObjectId(userId) },
            { $inc: { transactionCount: 1 } },
            { session },
          )
          .exec();
        if (claimed.matchedCount !== 1) {
          throw new NotFoundException('Account not found.');
        }

        const [transaction] = await this.transactionModel.create(
          [
            {
              ...input,
              userId: new Types.ObjectId(userId),
              accountId: account._id,
              amountMinor,
              currency: account.currency,
              date: new Date(input.date),
            },
          ],
          { session },
        );
        created = transaction;
      });
      if (!created) {
        throw new InternalServerErrorException('Unable to create transaction.');
      }
      return toTransactionResponse(created);
    } finally {
      await session.endSession();
    }
  }

  async list(userId: string, query: TransactionQueryDto): Promise<TransactionPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filter: FilterQuery<Transaction> = { userId: new Types.ObjectId(userId) };

    if (query.accountId) {
      const account = await this.accountModel
        .exists({ _id: query.accountId, userId: new Types.ObjectId(userId) })
        .exec();
      if (!account) throw new NotFoundException('Account not found.');
      filter.accountId = new Types.ObjectId(query.accountId);
    }
    if (query.type) filter.type = query.type;
    if (query.category) filter.category = query.category;
    if (query.startDate || query.endDate) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.startDate) range.$gte = parseQueryDate(query.startDate, false);
      if (query.endDate) range.$lte = parseQueryDate(query.endDate, true);
      if (range.$gte && range.$lte && range.$gte > range.$lte) {
        throw new BadRequestException('startDate must be before or equal to endDate.');
      }
      filter.date = range;
    }

    const sortField = query.sortBy ?? 'date';
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: direction, _id: direction };
    const [documents, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
    ]);

    return {
      items: documents.map(toTransactionResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async get(userId: string, transactionId: string): Promise<TransactionResponse> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Transaction not found.');
    }
    const transaction = await this.transactionModel
      .findOne({ _id: transactionId, userId: new Types.ObjectId(userId) })
      .exec();
    if (!transaction) throw new NotFoundException('Transaction not found.');
    return toTransactionResponse(transaction);
  }

  async update(
    userId: string,
    transactionId: string,
    input: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Transaction not found.');
    }
    if (!Object.keys(input).length) {
      throw new BadRequestException('Provide at least one transaction field to update.');
    }
    const amountMinor =
      input.amountMinor === undefined
        ? undefined
        : validateAmount(input.amountMinor);
    const session = await this.connection.startSession();
    let updated: TransactionDocument | undefined;
    try {
      await session.withTransaction(async () => {
        const current = await this.transactionModel
          .findOne({ _id: transactionId, userId: new Types.ObjectId(userId) })
          .session(session)
          .exec();
        if (!current) throw new NotFoundException('Transaction not found.');

        const nextAccountId = input.accountId
          ? new Types.ObjectId(input.accountId)
          : current.accountId;
        const reassigned = !nextAccountId.equals(current.accountId);

        if (input.accountId) {
          const targetAccount = await this.accountModel
            .findOne({
              _id: input.accountId,
              userId: new Types.ObjectId(userId),
            })
            .session(session)
            .exec();
          if (!targetAccount) throw new NotFoundException('Account not found.');
          if (reassigned) {
            const incremented = await this.accountModel
              .updateOne(
                { _id: targetAccount._id, userId: new Types.ObjectId(userId) },
                { $inc: { transactionCount: 1 } },
                { session },
              )
              .exec();
            if (incremented.matchedCount !== 1) {
              throw new NotFoundException('Account not found.');
            }
            const decremented = await this.accountModel
              .updateOne(
                {
                  _id: current.accountId,
                  userId: new Types.ObjectId(userId),
                  transactionCount: { $gt: 0 },
                },
                { $inc: { transactionCount: -1 } },
                { session },
              )
              .exec();
            if (decremented.matchedCount !== 1) {
              throw new InternalServerErrorException(
                'Unable to update transaction because its account state is inconsistent.',
              );
            }
          }
        }

        const changes: Partial<Transaction> = {};
        if (input.accountId) changes.accountId = nextAccountId;
        if (input.type !== undefined) changes.type = input.type;
        if (input.amountMinor !== undefined) {
          changes.amountMinor = amountMinor;
        }
        if (input.category !== undefined) changes.category = input.category;
        if (input.description !== undefined) changes.description = input.description;
        if (input.date !== undefined) changes.date = new Date(input.date);

        const result = await this.transactionModel
          .findOneAndUpdate(
            { _id: transactionId, userId: new Types.ObjectId(userId) },
            { $set: changes },
            { new: true, runValidators: true, session },
          )
          .exec();
        if (!result) throw new NotFoundException('Transaction not found.');
        updated = result;
      });
      if (!updated) {
        throw new InternalServerErrorException('Unable to update transaction.');
      }
      return toTransactionResponse(updated);
    } finally {
      await session.endSession();
    }
  }

  async remove(userId: string, transactionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundException('Transaction not found.');
    }
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = await this.transactionModel
          .findOneAndDelete({
            _id: transactionId,
            userId: new Types.ObjectId(userId),
          })
          .session(session)
          .exec();
        if (!transaction) throw new NotFoundException('Transaction not found.');
        const decremented = await this.accountModel
          .updateOne(
            {
              _id: transaction.accountId,
              userId: new Types.ObjectId(userId),
              transactionCount: { $gt: 0 },
            },
            { $inc: { transactionCount: -1 } },
            { session },
          )
          .exec();
        if (decremented.matchedCount !== 1) {
          throw new InternalServerErrorException(
            'Unable to delete transaction because its account state is inconsistent.',
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }
}

function validateAmount(amountMinor: number): number {
  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor < 1 ||
    amountMinor > MAX_AMOUNT_MINOR
  ) {
    throw new BadRequestException(
      `amountMinor must be a positive integer no greater than ${MAX_AMOUNT_MINOR}.`,
    );
  }
  return amountMinor;
}

function parseQueryDate(value: string, endOfDay: boolean): Date {
  const date = new Date(value);
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function toTransactionResponse(
  transaction: TransactionDocument,
): TransactionResponse {
  return {
    id: transaction._id.toString(),
    accountId: transaction.accountId.toString(),
    type: transaction.type,
    amountMinor: transaction.amountMinor,
    currency: transaction.currency,
    category: transaction.category,
    description: transaction.description ?? '',
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
