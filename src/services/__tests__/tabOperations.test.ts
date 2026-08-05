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

import { computeSortedOrder, findDuplicates } from '../tabOperations';
import { TabInfo } from '../../types';

function tab(overrides: Partial<TabInfo> & { id: number; index: number }): TabInfo {
  return {
    windowId: 1,
    title: `Tab ${overrides.id}`,
    url: `https://example.com/${overrides.id}`,
    active: false,
    pinned: false,
    groupId: -1,
    ...overrides,
  };
}

describe('computeSortedOrder', () => {
  it('sorts ungrouped tabs as before', () => {
    const tabs = [
      tab({ id: 1, index: 0, title: 'Zebra' }),
      tab({ id: 2, index: 1, title: 'Apple' }),
      tab({ id: 3, index: 2, title: 'Mango' }),
    ];
    const order = computeSortedOrder(tabs, 'title');
    expect(order.map(t => t.id)).toEqual([2, 3, 1]);
  });

  it('keeps group blocks in place and sorts within each block', () => {
    // Layout: [u1, g:a, g:b, u2] — group occupies slots 1-2
    const tabs = [
      tab({ id: 1, index: 0, title: 'Zebra' }),
      tab({ id: 2, index: 1, title: 'Walrus', groupId: 10 }),
      tab({ id: 3, index: 2, title: 'Bear', groupId: 10 }),
      tab({ id: 4, index: 3, title: 'Apple' }),
    ];
    const order = computeSortedOrder(tabs, 'title');
    // Group slots 1-2 keep group tabs (sorted: Bear, Walrus);
    // ungrouped slots 0,3 get sorted ungrouped tabs (Apple, Zebra)
    expect(order.map(t => t.id)).toEqual([4, 3, 2, 1]);
    expect(order.map(t => t.groupId)).toEqual([-1, 10, 10, -1]);
  });

  it('handles multiple groups independently', () => {
    const tabs = [
      tab({ id: 1, index: 0, title: 'B', groupId: 10 }),
      tab({ id: 2, index: 1, title: 'A', groupId: 10 }),
      tab({ id: 3, index: 2, title: 'Z' }),
      tab({ id: 4, index: 3, title: 'D', groupId: 20 }),
      tab({ id: 5, index: 4, title: 'C', groupId: 20 }),
    ];
    const order = computeSortedOrder(tabs, 'title');
    expect(order.map(t => t.id)).toEqual([2, 1, 3, 5, 4]);
  });

  it('leaves pinned tabs in place', () => {
    const tabs = [
      tab({ id: 1, index: 0, title: 'Zebra', pinned: true }),
      tab({ id: 2, index: 1, title: 'Mango' }),
      tab({ id: 3, index: 2, title: 'Apple' }),
    ];
    const order = computeSortedOrder(tabs, 'title');
    expect(order.map(t => t.id)).toEqual([1, 3, 2]);
  });

  it('sorts by domain within groups', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://zzz.com/x', groupId: 10 }),
      tab({ id: 2, index: 1, url: 'https://aaa.com/y', groupId: 10 }),
    ];
    const order = computeSortedOrder(tabs, 'domain');
    expect(order.map(t => t.id)).toEqual([2, 1]);
  });
});

describe('findDuplicates (group-aware)', () => {
  it('finds duplicates among ungrouped tabs', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://example.com/a' }),
      tab({ id: 2, index: 1, url: 'https://example.com/a' }),
    ];
    const dups = findDuplicates(tabs);
    expect(dups).toHaveLength(1);
    expect(dups[0].tabs.map(t => t.id)).toEqual([1, 2]);
  });

  it('finds duplicates within the same group', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://example.com/a', groupId: 10 }),
      tab({ id: 2, index: 1, url: 'https://example.com/a', groupId: 10 }),
    ];
    expect(findDuplicates(tabs)).toHaveLength(1);
  });

  it('does not match a grouped tab against an ungrouped duplicate', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://example.com/a', groupId: 10 }),
      tab({ id: 2, index: 1, url: 'https://example.com/a' }),
    ];
    expect(findDuplicates(tabs)).toHaveLength(0);
  });

  it('does not match duplicates across two different groups', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://example.com/a', groupId: 10 }),
      tab({ id: 2, index: 1, url: 'https://example.com/a', groupId: 20 }),
    ];
    expect(findDuplicates(tabs)).toHaveLength(0);
  });

  it('still finds ungrouped duplicates across windows', () => {
    const tabs = [
      tab({ id: 1, index: 0, url: 'https://example.com/a', windowId: 1 }),
      tab({ id: 2, index: 0, url: 'https://example.com/a', windowId: 2 }),
    ];
    expect(findDuplicates(tabs)).toHaveLength(1);
  });
});
