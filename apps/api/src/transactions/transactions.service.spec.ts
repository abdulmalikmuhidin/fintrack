import { NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Account } from '../accounts/account.schema';
import { CreateTransactionDto } from './dto/transaction.dto';
import { Transaction, TransactionDocument } from './transaction.schema';
import { TransactionsService } from './transactions.service';

const userId = '65aa00000000000000000001';
const accountId = '65aa00000000000000000002';
const transactionId = '65aa00000000000000000003';

function transactionDocument(): TransactionDocument {
  return {
    _id: new Types.ObjectId(transactionId),
    userId: new Types.ObjectId(userId),
    accountId: new Types.ObjectId(accountId),
    type: 'expense',
    amountMinor: 1299,
    currency: 'USD',
    category: 'Food',
    description: 'Lunch',
    date: new Date('2026-10-19T00:00:00.000Z'),
    createdAt: new Date('2026-10-19T00:00:00.000Z'),
    updatedAt: new Date('2026-10-19T00:00:00.000Z'),
  } as TransactionDocument;
}

function query<T>(result: T) {
  const chain: {
    session: jest.Mock;
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    exec: jest.Mock;
  } = {} as {
    session: jest.Mock;
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    exec: jest.Mock;
  };
  chain.session = jest.fn(() => chain);
  chain.sort = jest.fn(() => chain);
  chain.skip = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.exec = jest.fn().mockResolvedValue(result);
  return chain;
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
    countDocuments: jest.Mock;
  };
  let accountModel: {
    findOne: jest.Mock;
    updateOne: jest.Mock;
    exists: jest.Mock;
  };
  let session: { withTransaction: jest.Mock; endSession: jest.Mock };

  beforeEach(() => {
    transactionModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };
    accountModel = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      exists: jest.fn(),
    };
    session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    service = new TransactionsService(
      transactionModel as unknown as Model<Transaction>,
      accountModel as unknown as Model<Account>,
      { startSession: jest.fn().mockResolvedValue(session) } as unknown as Connection,
    );
  });

  it('creates an owned transaction and snapshots the account currency', async () => {
    accountModel.findOne.mockReturnValue(
      query({ _id: new Types.ObjectId(accountId), currency: 'USD' }),
    );
    accountModel.updateOne.mockReturnValue(query({ matchedCount: 1 }));
    transactionModel.create.mockResolvedValue([transactionDocument()]);

    const input: CreateTransactionDto = {
      accountId,
      type: 'expense',
      amountMinor: 1299,
      category: 'Food',
      description: 'Lunch',
      date: '2026-10-19',
    };
    const result = await service.create(userId, input);

    expect(accountModel.findOne).toHaveBeenCalledWith({
      _id: accountId,
      userId: new Types.ObjectId(userId),
    });
    expect(transactionModel.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          userId: new Types.ObjectId(userId),
          accountId: new Types.ObjectId(accountId),
          amountMinor: 1299,
          currency: 'USD',
        }),
      ],
      { session },
    );
    expect(result).toMatchObject({ amountMinor: 1299, currency: 'USD' });
    expect(result).not.toHaveProperty('userId');
  });

  it('lists only owned records with bounded pagination and requested filters', async () => {
    const listing = query([transactionDocument()]);
    transactionModel.find.mockReturnValue(listing);
    transactionModel.countDocuments.mockReturnValue(query(1));
    accountModel.exists.mockReturnValue(query({ _id: accountId }));

    const result = await service.list(userId, {
      page: 2,
      limit: 5,
      accountId,
      type: 'expense',
      category: 'Food',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      sortBy: 'date',
      sortOrder: 'desc',
    });
    expect(transactionModel.find).toHaveBeenCalledWith({
      userId: new Types.ObjectId(userId),
      accountId: new Types.ObjectId(accountId),
      type: 'expense',
      category: 'Food',
      date: {
        $gte: new Date('2026-10-01'),
        $lte: new Date('2026-10-31T23:59:59.999Z'),
      },
    });
    expect(listing.skip).toHaveBeenCalledWith(5);
    expect(listing.limit).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({ total: 1, page: 2, limit: 5, totalPages: 1 });
  });

  it('rejects reversed date ranges', async () => {
    await expect(
      service.list(userId, {
        startDate: '2026-10-20',
        endDate: '2026-10-01',
      }),
    ).rejects.toThrow('startDate must be before or equal to endDate.');
    expect(transactionModel.find).not.toHaveBeenCalled();
  });

  it('does not return a transaction owned by another user', async () => {
    transactionModel.findOne.mockReturnValue(query(null));
    await expect(service.get(userId, transactionId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(transactionModel.findOne).toHaveBeenCalledWith({
      _id: transactionId,
      userId: new Types.ObjectId(userId),
    });
  });

  it('refuses to associate a transaction with another user’s account', async () => {
    transactionModel.findOne.mockReturnValue(query(transactionDocument()));
    accountModel.findOne.mockReturnValue(query(null));

    await expect(
      service.update(userId, transactionId, { accountId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(accountModel.findOne).toHaveBeenCalledWith({
      _id: accountId,
      userId: new Types.ObjectId(userId),
    });
    expect(transactionModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('updates an owned transaction', async () => {
    transactionModel.findOne.mockReturnValue(query(transactionDocument()));
    transactionModel.findOneAndUpdate.mockReturnValue(query(transactionDocument()));

    const result = await service.update(userId, transactionId, {
      category: 'Groceries',
    });

    expect(transactionModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: transactionId, userId: new Types.ObjectId(userId) },
      { $set: { category: 'Groceries' } },
      { new: true, runValidators: true, session },
    );
    expect(result.id).toBe(transactionId);
  });

  it('deletes an owned transaction and decrements its account transaction counter', async () => {
    transactionModel.findOneAndDelete.mockReturnValue(query(transactionDocument()));
    accountModel.updateOne.mockReturnValue(query({ matchedCount: 1 }));

    await expect(service.remove(userId, transactionId)).resolves.toBeUndefined();
    expect(transactionModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: transactionId,
      userId: new Types.ObjectId(userId),
    });
    expect(accountModel.updateOne).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(accountId),
        userId: new Types.ObjectId(userId),
        transactionCount: { $gt: 0 },
      },
      { $inc: { transactionCount: -1 } },
      { session },
    );
  });

  it('rejects invalid minor-unit amounts before updating account state', async () => {
    await expect(
      service.create(userId, {
        accountId,
        type: 'expense',
        amountMinor: Number.POSITIVE_INFINITY,
        category: 'Food',
        date: '2026-10-19',
      }),
    ).rejects.toThrow('amountMinor must be a positive integer');
    expect(accountModel.updateOne).not.toHaveBeenCalled();
    expect(accountModel.findOne).not.toHaveBeenCalled();
  });
});
