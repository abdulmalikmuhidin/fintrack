import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /**
   * Health check endpoint
   * This checks API liveness only - does not verify database connectivity
   * For database connectivity checks, a separate endpoint or enhanced check would be needed
   */
  check() {
    return {
      status: 'ok',
      service: 'fintrack-api',
    };
  }
}