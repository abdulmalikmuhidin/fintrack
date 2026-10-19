import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
  it('requires authentication at the controller boundary', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AccountsController);
    expect(guards).toHaveLength(1);
  });
});
