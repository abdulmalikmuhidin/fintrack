import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAccountDto } from './account.dto';

describe('account DTO validation', () => {
  it('normalizes currency casing and trims account names', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: '  Savings  ',
      type: 'savings',
      currency: ' usd ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.name).toBe('Savings');
    expect(dto.currency).toBe('USD');
  });

  it('rejects unsupported account types and malformed currency codes', async () => {
    const dto = plainToInstance(CreateAccountDto, {
      name: 'Wallet',
      type: 'investment',
      currency: 'US',
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['type', 'currency']),
    );
  });
});
