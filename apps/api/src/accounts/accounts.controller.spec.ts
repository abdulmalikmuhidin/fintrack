import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AccountsController } from './accounts.controller';
import { TrustedOriginGuard } from '../auth/guards/trusted-origin.guard';

describe('AccountsController', () => {
  it('requires authentication at the controller boundary', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AccountsController);
    expect(guards).toHaveLength(1);
  });

  it('validates trusted origin on mutations', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AccountsController.prototype.create,
    );
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(TrustedOriginGuard);
  });
});
