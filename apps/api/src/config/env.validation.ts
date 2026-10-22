export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const mongoUri = getString(environment, 'MONGODB_URI');
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured.');
  }

  const jwtSecret = getString(environment, 'JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  const expirationSeconds = Number(
    environment.JWT_EXPIRES_IN_SECONDS ?? 900,
  );
  if (
    !Number.isInteger(expirationSeconds) ||
    expirationSeconds < 300 ||
    expirationSeconds > 86400
  ) {
    throw new Error(
      'JWT_EXPIRES_IN_SECONDS must be an integer between 300 and 86400.',
    );
  }

  const port = Number(environment.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const frontendUrl = getString(environment, 'FRONTEND_URL') || 'http://localhost:3000';
  let frontendOrigin: string;
  try {
    const parsedUrl = new URL(frontendUrl);
    if (
      !['http:', 'https:'].includes(parsedUrl.protocol) ||
      parsedUrl.pathname !== '/' ||
      parsedUrl.search ||
      parsedUrl.hash
    ) {
      throw new Error();
    }
    frontendOrigin = parsedUrl.origin;
  } catch {
    throw new Error('FRONTEND_URL must be a valid web origin.');
  }
  if (environment.NODE_ENV === 'production' && !frontendOrigin.startsWith('https://')) {
    throw new Error('FRONTEND_URL must use HTTPS in production.');
  }

  const swaggerSetting = environment.SWAGGER_ENABLED;
  if (
    swaggerSetting !== undefined &&
    swaggerSetting !== 'true' &&
    swaggerSetting !== 'false'
  ) {
    throw new Error('SWAGGER_ENABLED must be either true or false.');
  }
  const swaggerEnabled =
    swaggerSetting === undefined
      ? environment.NODE_ENV !== 'production'
      : swaggerSetting === 'true';

  const rawCookieDomain = getString(environment, 'COOKIE_DOMAIN');
  let cookieDomain: string | undefined;
  if (rawCookieDomain) {
    if (rawCookieDomain.includes('/') || rawCookieDomain.includes(':')) {
      throw new Error('COOKIE_DOMAIN must be a valid domain or subdomain.');
    }
    const normalized = rawCookieDomain.toLowerCase().replace(/^\.+/, '');
    const publicSuffixes = [
      'onrender.com',
      'vercel.app',
      'netlify.app',
      'railway.app',
      'herokuapp.com',
      'github.io',
    ];
    // If set to a public suffix or cloud provider domain, omit domain attribute
    // so the cookie is host-only and won't be rejected by browsers.
    if (!publicSuffixes.includes(normalized) && !normalized.endsWith('.onrender.com') && !normalized.endsWith('.vercel.app')) {
      cookieDomain = rawCookieDomain;
    }
  }

  return {
    ...environment,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: expirationSeconds,
    PORT: port,
    FRONTEND_URL: frontendOrigin,
    SWAGGER_ENABLED: swaggerEnabled,
    COOKIE_DOMAIN: cookieDomain,
  };
}

function getString(
  environment: Record<string, unknown>,
  key: string,
): string {
  const value = environment[key];
  return typeof value === 'string' ? value.trim() : '';
}
