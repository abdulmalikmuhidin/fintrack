import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TransactionsController } from './transactions.controller';

describe('TransactionsController', () => {
  it('requires authentication at the controller boundary', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TransactionsController);
    expect(guards).toHaveLength(1);
  });
});
