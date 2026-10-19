import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  accountId: Types.ObjectId;

  @Prop({ required: true, enum: TRANSACTION_TYPES })
  type: TransactionType;

  @Prop({ required: true, type: Number, min: 1, max: 100_000_000_000 })
  amountMinor: number;

  @Prop({ required: true, match: /^[A-Z]{3}$/ })
  currency: string;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: 60 })
  category: string;

  @Prop({ trim: true, maxlength: 500, default: '' })
  description: string;

  @Prop({ required: true, type: Date })
  date: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, date: -1, _id: -1 });
TransactionSchema.index({ userId: 1, accountId: 1, date: -1, _id: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
