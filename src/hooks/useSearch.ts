import { useState, useMemo } from 'react';
import { WindowInfo } from '../types';

export function useSearch(windows: WindowInfo[]) {
  const [query, setQuery] = useState('');

  const filteredWindows = useMemo(() => {
    if (!query.trim()) {
      return windows;
    }

    const lowerQuery = query.toLowerCase();

    return windows
      .map(window => ({
        ...window,
        tabs: window.tabs.filter(
          tab =>
            tab.title.toLowerCase().includes(lowerQuery) ||
            tab.url.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter(window => window.tabs.length > 0);
  }, [windows, query]);

  return { query, setQuery, filteredWindows };
}
