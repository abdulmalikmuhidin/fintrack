/**
 * Thin wrapper around `window.location.replace` so tests can mock navigation
 * without fighting jsdom's read-only `Location` object.
 */
export function navigateReplace(url: string): void {
  window.location.replace(url);
}

