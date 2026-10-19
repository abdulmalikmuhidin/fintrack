import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  it('passes the authenticated user and validated report filters to the service', async () => {
    const summary = { currencies: [], monthly: [], expenseCategories: [], recentTransactions: [] };
    const dashboardService = {
      getSummary: jest.fn().mockResolvedValue(summary),
    } as unknown as DashboardService;
    const controller = new DashboardController(dashboardService);
    const user = {
      id: '65aa00000000000000000001',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const query = { startDate: '2026-01-01', endDate: '2026-01-31' };

    await expect(controller.summary(user, query)).resolves.toBe(summary);
    expect(dashboardService.getSummary).toHaveBeenCalledWith(user.id, query);
  });
});
