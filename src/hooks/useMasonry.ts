import { useMemo } from 'react';

/**
 * Distributes items across columns using "shortest column first" algorithm.
 *
 * For each item, finds the column with the smallest cumulative height
 * and places the item there. This creates an optimal masonry layout
 * that minimizes the difference in column heights.
 *
 * @param items - Array of items to distribute
 * @param getItemHeight - Function to estimate an item's height
 * @param columnCount - Number of columns to distribute across
 * @returns Array of columns, each containing their assigned items
 */
export function useMasonry<T>(
  items: T[],
  getItemHeight: (item: T) => number,
  columnCount: number
): T[][] {
  return useMemo(() => {
    if (columnCount <= 0 || items.length === 0) {
      return columnCount <= 0 ? [[]] : [items];
    }

    // Initialize empty columns and height trackers
    const columnHeights: number[] = Array(columnCount).fill(0);
    const columns: T[][] = Array.from({ length: columnCount }, () => []);

    for (const item of items) {
      // Find the shortest column
      let shortestIndex = 0;
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < columnHeights[shortestIndex]) {
          shortestIndex = i;
        }
      }

      // Add item to shortest column and update height
      columns[shortestIndex].push(item);
      columnHeights[shortestIndex] += getItemHeight(item);
    }

    return columns;
  }, [items, getItemHeight, columnCount]);
}
