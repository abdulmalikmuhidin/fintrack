import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TransactionsController } from './transactions.controller';
import { TrustedOriginGuard } from '../auth/guards/trusted-origin.guard';

describe('TransactionsController', () => {
  it('requires authentication at the controller boundary', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, TransactionsController);
    expect(guards).toHaveLength(1);
  });

  it('validates trusted origin on mutations', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TransactionsController.prototype.create,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(TrustedOriginGuard);
  });
});
