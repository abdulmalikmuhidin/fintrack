import '@testing-library/jest-dom';
import enMessages from './src/messages/en.json';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      replace: jest.fn(),
      push: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

function getNested(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace?: string) => {
    return (key: string, values?: Record<string, any>) => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      let text = getNested(enMessages, fullPath);
      if (text === undefined) {
        text = getNested(enMessages, key) ?? key;
      }
      if (values && typeof text === 'string') {
        Object.entries(values).forEach(([k, v]) => {
          text = text?.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    };
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getMessages: async () => enMessages,
  getTranslations: async (namespace?: string) => {
    return (key: string, values?: Record<string, any>) => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      let text = getNested(enMessages, fullPath) ?? key;
      if (values && typeof text === 'string') {
        Object.entries(values).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    };
  },
}));
