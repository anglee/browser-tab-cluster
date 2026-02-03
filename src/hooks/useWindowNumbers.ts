import { useRef, useCallback } from 'react';
import { WindowInfo } from '../types';

/**
 * Hook to map internal Chrome window IDs to user-friendly 1-based numbers.
 *
 * - Assigns the smallest available number to new windows
 * - Numbers are sticky: a window keeps its number until closed
 * - When a window is closed, its number becomes available for reuse
 */
export function useWindowNumbers(windows: WindowInfo[]): (windowId: number) => number {
  // Map from Chrome window ID to display number
  const windowNumberMap = useRef<Map<number, number>>(new Map());

  // Get current window IDs
  const currentWindowIds = new Set(windows.map(w => w.id));

  // Remove closed windows from the map
  for (const [windowId] of windowNumberMap.current) {
    if (!currentWindowIds.has(windowId)) {
      windowNumberMap.current.delete(windowId);
    }
  }

  // Find numbers currently in use
  const usedNumbers = new Set(windowNumberMap.current.values());

  // Assign numbers to new windows
  for (const window of windows) {
    if (!windowNumberMap.current.has(window.id)) {
      // Find the smallest available number (starting from 1)
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      windowNumberMap.current.set(window.id, nextNumber);
      usedNumbers.add(nextNumber);
    }
  }

  // Return a function to get the display number for a window
  const getWindowNumber = useCallback((windowId: number): number => {
    return windowNumberMap.current.get(windowId) ?? 0;
  }, []);

  return getWindowNumber;
}
