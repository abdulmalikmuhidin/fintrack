import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateTransactionDto,
  TransactionQueryDto,
} from './transaction.dto';

describe('transaction DTO validation', () => {
  it('rejects zero or non-integer minor-unit amounts and invalid dates', async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      accountId: '65aa00000000000000000002',
      type: 'expense',
      amountMinor: 0.5,
      category: 'Food',
      date: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['amountMinor', 'date']),
    );
  });

  it('rejects unsupported sort fields and invalid pagination values', async () => {
    const dto = plainToInstance(TransactionQueryDto, {
      page: 0,
      limit: 1000,
      sortBy: 'userId',
      sortOrder: 'sideways',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'limit', 'sortBy', 'sortOrder']),
    );
  });
});
