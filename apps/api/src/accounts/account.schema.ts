import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'other'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

@Schema({ timestamps: true, collection: 'accounts' })
export class Account {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 100 })
  name: string;

  @Prop({ required: true, enum: ACCOUNT_TYPES })
  type: AccountType;

  @Prop({ required: true, match: /^[A-Z]{3}$/ })
  currency: string;

  @Prop({ required: true, default: 0, select: false, min: 0 })
  transactionCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type AccountDocument = HydratedDocument<Account>;
export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index({ userId: 1, createdAt: -1 });
