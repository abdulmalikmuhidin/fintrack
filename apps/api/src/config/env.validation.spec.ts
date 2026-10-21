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
      SWAGGER_ENABLED: true,
      COOKIE_DOMAIN: undefined,
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

  it('requires HTTPS and disables Swagger by default in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('FRONTEND_URL must use HTTPS in production.');

    expect(
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_URL: 'https://fintrack.example',
        NODE_ENV: 'production',
      }),
    ).toMatchObject({ SWAGGER_ENABLED: false });
  });

  it('allows Swagger to be explicitly enabled and rejects malformed settings', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        FRONTEND_URL: 'https://fintrack.example',
        NODE_ENV: 'production',
        SWAGGER_ENABLED: 'true',
      }),
    ).toMatchObject({ SWAGGER_ENABLED: true });

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SWAGGER_ENABLED: 'yes',
      }),
    ).toThrow('SWAGGER_ENABLED must be either true or false.');
  });

  it('validates optional COOKIE_DOMAIN setting', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        COOKIE_DOMAIN: '.example.com',
      }),
    ).toMatchObject({ COOKIE_DOMAIN: '.example.com' });

    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        COOKIE_DOMAIN: 'http://example.com',
      }),
    ).toThrow('COOKIE_DOMAIN must be a valid domain or subdomain.');
  });
});
