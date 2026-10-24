import { fireEvent, render, screen } from '@testing-library/react';
import LanguageSwitcher from './language-switcher';

const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = '';
  });

  it('renders English and Amharic language options', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox', { name: /select language/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'አማርኛ' })).toBeInTheDocument();
  });

  it('sets the NEXT_LOCALE cookie and triggers router refresh on change', () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole('combobox', { name: /select language/i });
    fireEvent.change(select, { target: { value: 'am' } });

    expect(document.cookie).toContain('NEXT_LOCALE=am');
    expect(mockRefresh).toHaveBeenCalled();
  });
});

