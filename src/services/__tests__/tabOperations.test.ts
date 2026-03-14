import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../tabOperations';

describe('normalizeUrl', () => {
  it('strips trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('lowercases the URL', () => {
    expect(normalizeUrl('https://Example.COM/Page')).toBe('https://example.com/page');
  });

  it('strips anchor-style hash fragments', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
    expect(normalizeUrl('https://example.com/page#top')).toBe('https://example.com/page');
  });

  it('treats two URLs differing only by anchor hash as the same', () => {
    const a = normalizeUrl('https://example.com/page#section');
    const b = normalizeUrl('https://example.com/page#other');
    expect(a).toBe(b);
  });

  it('preserves query params', () => {
    expect(normalizeUrl('https://example.com/page?q=foo')).toBe('https://example.com/page?q=foo');
  });

  it('produces different results for different query params', () => {
    const a = normalizeUrl('https://example.com/page?q=foo');
    const b = normalizeUrl('https://example.com/page?q=bar');
    expect(a).not.toBe(b);
  });

  it('preserves route hash starting with #/', () => {
    expect(normalizeUrl('https://example.com/#/dashboard')).toBe('https://example.com#/dashboard');
  });

  it('preserves route hash starting with #!/', () => {
    expect(normalizeUrl('https://example.com/#!/settings')).toBe('https://example.com#!/settings');
  });

  it('preserves route hash with query params inside hash', () => {
    expect(normalizeUrl('https://example.com/#/aaa?foo=bar')).toBe('https://example.com#/aaa?foo=bar');
  });

  it('produces different results for different route hashes', () => {
    const a = normalizeUrl('https://example.com/#/a');
    const b = normalizeUrl('https://example.com/#/b');
    expect(a).not.toBe(b);
  });

  it('returns lowercased string for invalid URLs', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
    expect(normalizeUrl('INVALID')).toBe('invalid');
  });
});
