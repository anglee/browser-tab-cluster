import { useState, useEffect, useCallback } from 'react';
import { ClosedTabInfo } from '../types';
import { getRecentlyClosed, subscribeToSessionChanges } from '../services/chromeApi';

export function useRecentlyClosed() {
  const [closedTabs, setClosedTabs] = useState<ClosedTabInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getRecentlyClosed();
      setClosedTabs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recently closed tabs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToSessionChanges(refresh);
    return unsubscribe;
  }, [refresh]);

  return { closedTabs, loading, error, refresh };
}
