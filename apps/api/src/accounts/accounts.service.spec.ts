import { ConflictException, NotFoundException } from '@nestjs/common';
import { Connection, Model, Types } from 'mongoose';
import { Transaction } from '../transactions/transaction.schema';
import { Account, AccountDocument } from './account.schema';
import { AccountsService } from './accounts.service';

const userId = '65aa00000000000000000001';
const accountId = '65aa00000000000000000003';

function accountDocument(): AccountDocument {
  return {
    _id: new Types.ObjectId(accountId),
    userId: new Types.ObjectId(userId),
    name: 'Everyday',
    type: 'checking',
    currency: 'USD',
    transactionCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  } as AccountDocument;
}

function query<T>(result: T) {
  const chain: {
    select: jest.Mock;
    session: jest.Mock;
    sort: jest.Mock;
    exec: jest.Mock;
  } = {} as {
    select: jest.Mock;
    session: jest.Mock;
    sort: jest.Mock;
    exec: jest.Mock;
  };
  chain.select = jest.fn(() => chain);
  chain.session = jest.fn(() => chain);
  chain.sort = jest.fn(() => chain);
  chain.exec = jest.fn().mockResolvedValue(result);
  return chain;
}

describe('AccountsService', () => {
  let service: AccountsService;
  let accountModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
  };
  let transactionModel: { exists: jest.Mock };
  let session: { withTransaction: jest.Mock; endSession: jest.Mock };

  beforeEach(() => {
    accountModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    };
    transactionModel = { exists: jest.fn() };
    session = {
      withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
      endSession: jest.fn(),
    };
    service = new AccountsService(
      accountModel as unknown as Model<Account>,
      transactionModel as unknown as Model<Transaction>,
      { startSession: jest.fn().mockResolvedValue(session) } as unknown as Connection,
    );
  });

  it('creates an account using only the authenticated user id and returns safe fields', async () => {
    accountModel.create.mockResolvedValue(accountDocument());
    const result = await service.create(userId, {
      name: 'Everyday',
      type: 'checking',
      currency: 'USD',
    });

    expect(accountModel.create).toHaveBeenCalledWith({
      name: 'Everyday',
      type: 'checking',
      currency: 'USD',
      userId: new Types.ObjectId(userId),
    });
    expect(result).toMatchObject({ id: accountId, name: 'Everyday', currency: 'USD' });
    expect(result).not.toHaveProperty('userId');
  });

  it('lists only accounts for the authenticated user', async () => {
    const listing = query([accountDocument()]);
    accountModel.find.mockReturnValue(listing);
    const result = await service.list(userId);

    expect(accountModel.find).toHaveBeenCalledWith({ userId: new Types.ObjectId(userId) });
    expect(result).toHaveLength(1);
    expect(listing.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
  });

  it('does not update an account owned by another user', async () => {
    accountModel.findOneAndUpdate.mockReturnValue(query(null));
    await expect(
      service.update(userId, accountId, { name: 'Renamed' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(accountModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: accountId, userId: new Types.ObjectId(userId) },
      { $set: { name: 'Renamed' } },
      { new: true, runValidators: true },
    );
  });

  it('prevents account deletion while its transactions exist', async () => {
    accountModel.findOne.mockReturnValue(query(accountDocument()));
    transactionModel.exists.mockReturnValue({
      session: jest.fn().mockResolvedValue({ _id: 'transaction' }),
    });
    await expect(service.remove(userId, accountId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(accountModel.findOneAndDelete).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
  });

  it('deletes an owned account only after confirming there are no transactions', async () => {
    accountModel.findOne.mockReturnValue(query(accountDocument()));
    transactionModel.exists.mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });
    accountModel.findOneAndDelete.mockReturnValue(query(accountDocument()));

    await expect(service.remove(userId, accountId)).resolves.toBeUndefined();
    expect(accountModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: accountId,
      userId: new Types.ObjectId(userId),
      transactionCount: 0,
    });
  });

  it('returns not found for an account not owned by the user', async () => {
    accountModel.findOne.mockReturnValue(query(null));
    await expect(service.remove(userId, accountId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
