import { ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { normalizeEmail, UsersService } from './users.service';

describe('UsersService', () => {
  it('normalizes email consistently', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('converts duplicate-key errors into a safe conflict response', async () => {
    const model = {
      create: jest.fn().mockRejectedValue({ code: 11000 }),
    };
    const service = new UsersService(model as unknown as Model<User>);

    await expect(
      service.createUser({
        name: 'Example User',
        email: ' USER@example.com ',
        password: 'A-Strong-Password123!',
      }),
    ).rejects.toThrow(
      new ConflictException('An account with this email already exists.'),
    );
  });
});
