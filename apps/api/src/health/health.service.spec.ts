import { HealthService } from './health.service';

describe('HealthService', () => {
  it('retains the API liveness response', () => {
    expect(new HealthService().check()).toEqual({
      status: 'ok',
      service: 'fintrack-api',
    });
  });
});
