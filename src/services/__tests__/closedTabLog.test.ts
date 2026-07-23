import { describe, it, expect } from 'vitest';
import {
  isLogId,
  isNoiseUrl,
  appendToLog,
  mergeClosedTabs,
  DEDUPE_WINDOW_MS,
} from '../closedTabLog';
import { ClosedTabInfo, ClosedTabLogEntry } from '../../types';

function sessionTab(overrides: Partial<ClosedTabInfo> = {}): ClosedTabInfo {
  return {
    sessionId: '5',
    source: 'session',
    title: 'Example',
    url: 'https://example.com/',
    closedTime: 1_000_000,
    ...overrides,
  };
}

function logEntry(overrides: Partial<ClosedTabLogEntry> = {}): ClosedTabLogEntry {
  return {
    id: 'log-1000000-abc123',
    title: 'Example',
    url: 'https://example.com/',
    closedTime: 1_000_000,
    ...overrides,
  };
}

describe('isLogId', () => {
  it('recognizes synthetic log ids', () => {
    expect(isLogId('log-1720680000000-x7f3a2')).toBe(true);
  });

  it('rejects real Chrome sessionIds', () => {
    expect(isLogId('5')).toBe(false);
    expect(isLogId('5.12')).toBe(false);
  });
});

describe('isNoiseUrl', () => {
  it('flags browser-internal and empty urls', () => {
    expect(isNoiseUrl('chrome://newtab/')).toBe(true);
    expect(isNoiseUrl('chrome-extension://abc/manager/index.html')).toBe(true);
    expect(isNoiseUrl('about:blank')).toBe(true);
    expect(isNoiseUrl('devtools://devtools/bundled/inspector.html')).toBe(true);
    expect(isNoiseUrl('edge://settings')).toBe(true);
    expect(isNoiseUrl('')).toBe(true);
  });

  it('allows normal web urls', () => {
    expect(isNoiseUrl('https://example.com/')).toBe(false);
    expect(isNoiseUrl('http://localhost:3000/')).toBe(false);
  });
});

describe('appendToLog', () => {
  it('prepends new entries (newest first)', () => {
    const log = [logEntry({ id: 'log-1-a' })];
    const result = appendToLog(log, logEntry({ id: 'log-2-b' }));
    expect(result.map(e => e.id)).toEqual(['log-2-b', 'log-1-a']);
  });

  it('evicts oldest entries beyond the cap', () => {
    const log = Array.from({ length: 3 }, (_, i) => logEntry({ id: `log-${i}-x` }));
    const result = appendToLog(log, logEntry({ id: 'log-new-y' }), 3);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('log-new-y');
    expect(result.map(e => e.id)).not.toContain('log-2-x');
  });
});

describe('mergeClosedTabs', () => {
  it('absorbs a log entry duplicating a session entry within the dedupe window', () => {
    const session = sessionTab({ closedTime: 1_000_000 });
    const log = logEntry({ closedTime: 1_000_000 + DEDUPE_WINDOW_MS });
    const result = mergeClosedTabs([session], [log], new Set());
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('session');
  });

  it('keeps a same-url log entry outside the dedupe window', () => {
    const session = sessionTab({ closedTime: 1_000_000 });
    const log = logEntry({ closedTime: 1_000_000 + DEDUPE_WINDOW_MS + 1 });
    const result = mergeClosedTabs([session], [log], new Set());
    expect(result).toHaveLength(2);
  });

  it('consumes session twins one-to-one so duplicate closes both survive', () => {
    // One session entry, two log entries with the same url/time:
    // only one log entry should be absorbed
    const session = sessionTab();
    const logs = [logEntry({ id: 'log-1-a' }), logEntry({ id: 'log-2-b' })];
    const result = mergeClosedTabs([session], logs, new Set());
    expect(result).toHaveLength(2);
    expect(result.filter(t => t.source === 'log')).toHaveLength(1);
  });

  it('hides session entries without resurrecting their absorbed log twin', () => {
    const session = sessionTab({ sessionId: '7' });
    const log = logEntry();
    const result = mergeClosedTabs([session], [log], new Set(['7']));
    expect(result).toHaveLength(0);
  });

  it('filters hidden log ids', () => {
    const log = logEntry({ id: 'log-1-a', url: 'https://other.com/' });
    const result = mergeClosedTabs([], [log], new Set(['log-1-a']));
    expect(result).toHaveLength(0);
  });

  it('drops noise urls from the log defensively', () => {
    const log = logEntry({ url: 'chrome://newtab/' });
    expect(mergeClosedTabs([], [log], new Set())).toHaveLength(0);
  });

  it('sorts by closedTime desc with session winning ties', () => {
    const oldSession = sessionTab({ sessionId: '1', url: 'https://a.com/', closedTime: 100 });
    const newLog = logEntry({ id: 'log-1-a', url: 'https://b.com/', closedTime: 300 });
    const tieSession = sessionTab({ sessionId: '2', url: 'https://c.com/', closedTime: 200 });
    const tieLog = logEntry({ id: 'log-2-b', url: 'https://d.com/', closedTime: 200 });
    const result = mergeClosedTabs([oldSession, tieSession], [newLog, tieLog], new Set());
    expect(result.map(t => t.sessionId)).toEqual(['log-1-a', '2', 'log-2-b', '1']);
  });
});
