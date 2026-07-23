import { useState, useEffect, useCallback, useRef } from 'react';
import { ClosedTabInfo } from '../types';
import { getRecentlyClosed, subscribeToSessionChanges } from '../services/chromeApi';
import { getClosedTabLog, mergeClosedTabs, subscribeToLogChanges } from '../services/closedTabLog';

export function useRecentlyClosed(hiddenIds: Set<string>) {
  const [closedTabs, setClosedTabs] = useState<ClosedTabInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to always have access to the latest hiddenIds
  const hiddenIdsRef = useRef(hiddenIds);
  hiddenIdsRef.current = hiddenIds;

  const refresh = useCallback(async () => {
    try {
      const [sessionTabs, logEntries] = await Promise.all([
        getRecentlyClosed(),
        getClosedTabLog(),
      ]);
      // Always use the current hiddenIds from the ref
      setClosedTabs(mergeClosedTabs(sessionTabs, logEntries, hiddenIdsRef.current));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recently closed tabs');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - uses ref for latest value

  // Subscribe to session and log changes once
  useEffect(() => {
    refresh();
    const unsubscribeSessions = subscribeToSessionChanges(refresh);
    const unsubscribeLog = subscribeToLogChanges(refresh);
    return () => {
      unsubscribeSessions();
      unsubscribeLog();
    };
  }, [refresh]);

  // Re-fetch when hiddenIds changes
  useEffect(() => {
    refresh();
  }, [hiddenIds, refresh]);

  return { closedTabs, loading, error, refresh };
}
