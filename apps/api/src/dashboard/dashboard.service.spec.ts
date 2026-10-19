import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DashboardService, assembleSummary } from './dashboard.service';

describe('DashboardService', () => {
  const userId = '65aa00000000000000000001';

  it('returns independent currency totals and month/category chart data', () => {
    const summary = assembleSummary(
      { startDate: '2026-01-01', endDate: '2026-01-31' },
      ['EUR', 'USD'],
      [
        { _id: 'USD', incomeMinor: 15_000, expenseMinor: 4_500, balanceMinor: 10_500 },
        { _id: 'JPY', incomeMinor: 4_000, expenseMinor: 1_000, balanceMinor: 3_000 },
      ],
      [
        { _id: 'USD', incomeMinor: 2_000, expenseMinor: 1_250 },
        { _id: 'JPY', incomeMinor: 500, expenseMinor: 100 },
      ],
      [
        {
          _id: { month: '2026-01', currency: 'USD' },
          incomeMinor: 2_000,
          expenseMinor: 1_250,
        },
      ],
      [
        { _id: { category: 'Food', currency: 'USD' }, amountMinor: 1_000 },
        { _id: { category: 'Transport', currency: 'USD' }, amountMinor: 250 },
      ],
      [
        {
          _id: new Types.ObjectId('65aa00000000000000000002'),
          accountId: new Types.ObjectId('65aa00000000000000000003'),
          accountName: 'Daily account',
          type: 'expense',
          amountMinor: 1_000,
          currency: 'USD',
          category: 'Food',
          description: 'Groceries',
          date: new Date('2026-01-20T10:00:00.000Z'),
        },
      ],
    );

    expect(summary.currencies).toEqual([
      {
        currency: 'EUR',
        balanceMinor: 0,
        incomeMinor: 0,
        expenseMinor: 0,
        netCashFlowMinor: 0,
      },
      {
        currency: 'JPY',
        balanceMinor: 3_000,
        incomeMinor: 500,
        expenseMinor: 100,
        netCashFlowMinor: 400,
      },
      {
        currency: 'USD',
        balanceMinor: 10_500,
        incomeMinor: 2_000,
        expenseMinor: 1_250,
        netCashFlowMinor: 750,
      },
    ]);
    expect(summary.monthly).toEqual([
      { month: '2026-01', currency: 'USD', incomeMinor: 2_000, expenseMinor: 1_250 },
    ]);
    expect(summary.expenseCategories).toEqual([
      { category: 'Food', currency: 'USD', amountMinor: 1_000 },
      { category: 'Transport', currency: 'USD', amountMinor: 250 },
    ]);
    expect(summary.recentTransactions[0]).toMatchObject({
      accountName: 'Daily account',
      category: 'Food',
      currency: 'USD',
      amountMinor: 1_000,
    });
  });

  it('returns zero account balances and empty chart/recent data for users without activity', () => {
    const summary = assembleSummary(
      { startDate: '2026-02-01', endDate: '2026-02-28' },
      ['CAD'],
      [],
      [],
      [],
      [],
      [],
    );

    expect(summary.currencies).toEqual([
      {
        currency: 'CAD',
        balanceMinor: 0,
        incomeMinor: 0,
        expenseMinor: 0,
        netCashFlowMinor: 0,
      },
    ]);
    expect(summary.monthly).toEqual([]);
    expect(summary.expenseCategories).toEqual([]);
    expect(summary.recentTransactions).toEqual([]);
  });

  it('validates date ranges and scopes aggregation pipelines to the authenticated user', async () => {
    const accountDistinct = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(['USD']),
    });
    const aggregateResults = [[], [], [], [], []];
    const pipelines: unknown[][] = [];
    const aggregate = jest.fn((pipeline: unknown[]) => {
      pipelines.push(pipeline);
      return { exec: jest.fn().mockResolvedValue(aggregateResults.shift()) };
    });
    const service = new DashboardService(
      { distinct: accountDistinct } as never,
      { aggregate } as never,
    );

    await expect(
      service.getSummary(userId, {
        startDate: '2026-02-31',
        endDate: '2026-03-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getSummary(userId, {
        startDate: '2026-03-02',
        endDate: '2026-03-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(aggregate).not.toHaveBeenCalled();

    await service.getSummary(userId, {
      startDate: '2026-01-05',
      endDate: '2026-01-31',
    });

    const owner = new Types.ObjectId(userId);
    expect(accountDistinct).toHaveBeenCalledWith('currency', { userId: owner });
    expect((pipelines[0][0] as { $match: { userId: Types.ObjectId } }).$match.userId.toString())
      .toBe(userId);
    expect((pipelines[1][0] as { $match: { userId: Types.ObjectId; date: { $gte: Date; $lt: Date } } }).$match)
      .toMatchObject({
        userId: owner,
        date: {
          $gte: new Date('2026-01-05T00:00:00.000Z'),
          $lt: new Date('2026-02-01T00:00:00.000Z'),
        },
      });
    expect(pipelines[3][0]).toMatchObject({
      $match: { userId: owner, type: 'expense' },
    });
  });
});
