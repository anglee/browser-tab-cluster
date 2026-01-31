import { useState, useEffect, useCallback } from 'react';
import { WindowInfo } from '../types';
import { getAllWindows, subscribeToChanges } from '../services/chromeApi';

export function useWindows() {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllWindows();
      setWindows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load windows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToChanges(refresh);
    return unsubscribe;
  }, [refresh]);

  return { windows, loading, error, refresh };
}
