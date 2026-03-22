import { useState, useEffect, useCallback } from 'react';
import { WindowInfo, TabGroupInfo } from '../types';
import { getAllWindows, getTabGroups, subscribeToChanges } from '../services/chromeApi';

export function useWindows() {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [tabGroups, setTabGroups] = useState<TabGroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [windowData, groupData] = await Promise.all([getAllWindows(), getTabGroups()]);
      setWindows(windowData);
      setTabGroups(groupData);
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

  return { windows, tabGroups, loading, error, refresh };
}
