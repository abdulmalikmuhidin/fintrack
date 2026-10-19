import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account } from '../accounts/account.schema';
import { Transaction } from '../transactions/transaction.schema';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';

interface CurrencyAggregate {
  _id: string;
  incomeMinor: number;
  expenseMinor: number;
  balanceMinor?: number;
}

interface MonthAggregate {
  _id: { month: string; currency: string };
  incomeMinor: number;
  expenseMinor: number;
}

interface CategoryAggregate {
  _id: { category: string; currency: string };
  amountMinor: number;
}

interface RecentTransactionAggregate {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  accountName: string;
  type: Transaction['type'];
  amountMinor: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
}

export interface DashboardCurrencySummary {
  currency: string;
  balanceMinor: number;
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
}

export interface DashboardSummary {
  period: { startDate: string; endDate: string };
  currencies: DashboardCurrencySummary[];
  monthly: Array<{
    month: string;
    currency: string;
    incomeMinor: number;
    expenseMinor: number;
  }>;
  expenseCategories: Array<{
    category: string;
    currency: string;
    amountMinor: number;
  }>;
  recentTransactions: Array<{
    id: string;
    accountId: string;
    accountName: string;
    type: Transaction['type'];
    amountMinor: number;
    currency: string;
    category: string;
    description: string;
    date: string;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  async getSummary(
    userId: string,
    query: DashboardSummaryQueryDto,
  ): Promise<DashboardSummary> {
    const period = resolvePeriod(query);
    const ownerId = new Types.ObjectId(userId);
    const periodMatch = {
      userId: ownerId,
      date: { $gte: period.start, $lt: period.endExclusive },
    };

    const [accountCurrencies, balances, periodTotals, monthly, categories, recent] =
      await Promise.all([
        this.accountModel.distinct('currency', { userId: ownerId }).exec(),
        this.transactionModel
          .aggregate<CurrencyAggregate>([
            { $match: { userId: ownerId } },
            {
              $group: {
                _id: '$currency',
                incomeMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amountMinor', 0],
                  },
                },
                expenseMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amountMinor', 0],
                  },
                },
                balanceMinor: {
                  $sum: {
                    $cond: [
                      { $eq: ['$type', 'income'] },
                      '$amountMinor',
                      { $multiply: ['$amountMinor', -1] },
                    ],
                  },
                },
              },
            },
          ])
          .exec(),
        this.transactionModel
          .aggregate<CurrencyAggregate>([
            { $match: periodMatch },
            {
              $group: {
                _id: '$currency',
                incomeMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amountMinor', 0],
                  },
                },
                expenseMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amountMinor', 0],
                  },
                },
              },
            },
          ])
          .exec(),
        this.transactionModel
          .aggregate<MonthAggregate>([
            { $match: periodMatch },
            {
              $group: {
                _id: {
                  month: {
                    $dateToString: {
                      date: '$date',
                      format: '%Y-%m',
                      timezone: 'UTC',
                    },
                  },
                  currency: '$currency',
                },
                incomeMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'income'] }, '$amountMinor', 0],
                  },
                },
                expenseMinor: {
                  $sum: {
                    $cond: [{ $eq: ['$type', 'expense'] }, '$amountMinor', 0],
                  },
                },
              },
            },
            { $sort: { '_id.month': 1, '_id.currency': 1 } },
          ])
          .exec(),
        this.transactionModel
          .aggregate<CategoryAggregate>([
            { $match: { ...periodMatch, type: 'expense' } },
            {
              $group: {
                _id: { category: '$category', currency: '$currency' },
                amountMinor: { $sum: '$amountMinor' },
              },
            },
            { $sort: { amountMinor: -1, '_id.category': 1 } },
          ])
          .exec(),
        this.transactionModel
          .aggregate<RecentTransactionAggregate>([
            { $match: { userId: ownerId } },
            { $sort: { date: -1, _id: -1 } },
            { $limit: 8 },
            {
              $lookup: {
                from: 'accounts',
                let: { accountId: '$accountId', ownerId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$accountId'] },
                          { $eq: ['$userId', '$$ownerId'] },
                        ],
                      },
                    },
                  },
                  { $project: { _id: 0, name: 1 } },
                ],
                as: 'account',
              },
            },
            {
              $project: {
                _id: 1,
                accountId: 1,
                accountName: {
                  $ifNull: [{ $arrayElemAt: ['$account.name', 0] }, 'Account unavailable'],
                },
                type: 1,
                amountMinor: 1,
                currency: 1,
                category: 1,
                description: 1,
                date: 1,
              },
            },
          ])
          .exec(),
      ]);

    return assembleSummary(
      period,
      accountCurrencies,
      balances,
      periodTotals,
      monthly,
      categories,
      recent,
    );
  }
}

type ResolvedPeriod = {
  startDate: string;
  endDate: string;
  start: Date;
  endExclusive: Date;
};

function resolvePeriod(query: DashboardSummaryQueryDto): ResolvedPeriod {
  const now = new Date();
  const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const startDate = query.startDate ?? toDateString(defaultStart);
  const endDate = query.endDate ?? toDateString(defaultEnd);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end || start > end) {
    throw new BadRequestException('startDate and endDate must form a valid, non-reversed date range.');
  }

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { startDate, endDate, start, endExclusive };
}

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateString(date) !== value ? null : date;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function assembleSummary(
  period: Pick<ResolvedPeriod, 'startDate' | 'endDate'>,
  accountCurrencies: string[],
  balances: CurrencyAggregate[],
  periodTotals: CurrencyAggregate[],
  monthly: MonthAggregate[],
  categories: CategoryAggregate[],
  recent: RecentTransactionAggregate[],
): DashboardSummary {
  const balanceByCurrency = new Map(balances.map((entry) => [entry._id, entry]));
  const totalsByCurrency = new Map(periodTotals.map((entry) => [entry._id, entry]));
  const currencies = new Set([
    ...accountCurrencies,
    ...balances.map((entry) => entry._id),
    ...periodTotals.map((entry) => entry._id),
  ]);

  return {
    period: { startDate: period.startDate, endDate: period.endDate },
    currencies: [...currencies].sort().map((currency) => {
      const balance = balanceByCurrency.get(currency);
      const totals = totalsByCurrency.get(currency);
      const incomeMinor = safeMinor(totals?.incomeMinor ?? 0);
      const expenseMinor = safeMinor(totals?.expenseMinor ?? 0);
      return {
        currency,
        balanceMinor: safeMinor(balance?.balanceMinor ?? 0),
        incomeMinor,
        expenseMinor,
        netCashFlowMinor: safeMinor(incomeMinor - expenseMinor),
      };
    }),
    monthly: monthly.map((entry) => ({
      month: entry._id.month,
      currency: entry._id.currency,
      incomeMinor: safeMinor(entry.incomeMinor),
      expenseMinor: safeMinor(entry.expenseMinor),
    })),
    expenseCategories: categories.map((entry) => ({
      category: entry._id.category,
      currency: entry._id.currency,
      amountMinor: safeMinor(entry.amountMinor),
    })),
    recentTransactions: recent.map((entry) => ({
      id: entry._id.toString(),
      accountId: entry.accountId.toString(),
      accountName: entry.accountName,
      type: entry.type,
      amountMinor: safeMinor(entry.amountMinor),
      currency: entry.currency,
      category: entry.category,
      description: entry.description ?? '',
      date: entry.date.toISOString(),
    })),
  };
}

function safeMinor(value: number): number {
  if (!Number.isSafeInteger(value)) {
    throw new InternalServerErrorException(
      'The financial summary exceeds the supported monetary precision.',
    );
  }
  return value;
}
