import { validateEnvironment } from './env.validation';

const validEnvironment = {
  MONGODB_URI: 'mongodb://localhost:27017/fintrack',
  JWT_SECRET: 'a-random-secret-with-more-than-thirty-two-characters',
  FRONTEND_URL: 'http://localhost:3000',
};

describe('validateEnvironment', () => {
  it('sets safe defaults and normalizes the frontend origin', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_URL: 'http://localhost:3000/',
      }),
    ).toMatchObject({
      PORT: 3001,
      JWT_EXPIRES_IN_SECONDS: 900,
      FRONTEND_URL: 'http://localhost:3000',
    });
  });

  it('rejects a missing database URI or weak JWT secret', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, MONGODB_URI: '' }),
    ).toThrow('MONGODB_URI must be configured.');
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_SECRET: 'too-short' }),
    ).toThrow('JWT_SECRET must contain at least 32 characters.');
  });

  it('rejects invalid token lifetimes and non-origin frontend URLs', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        JWT_EXPIRES_IN_SECONDS: '60',
      }),
    ).toThrow('JWT_EXPIRES_IN_SECONDS must be an integer');
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_URL: 'http://localhost:3000/path',
      }),
    ).toThrow('FRONTEND_URL must be a valid web origin.');
  });
});
