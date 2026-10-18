import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { PublicUser } from './user.types';
import { User, UserDocument } from './user.schema';

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async createUser(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);

    try {
      const user = await this.userModel.create({
        name: input.name.trim(),
        email,
        passwordHash,
      });
      return toPublicUser(user);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  findByEmailForAuthentication(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+passwordHash')
      .exec();
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await this.userModel.findById(id).exec();
    return user ? toPublicUser(user) : null;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
