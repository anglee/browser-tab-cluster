import { useState, useEffect } from 'react';

/**
 * Hook to get responsive column count based on window width.
 * Matches Tailwind breakpoints: md (768px), 2xl (1536px)
 */
export function useColumnCount(): number {
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1536) return 3; // 2xl
    if (window.innerWidth >= 768) return 2;  // md
    return 1;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1536) {
        setColumnCount(3);
      } else if (window.innerWidth >= 768) {
        setColumnCount(2);
      } else {
        setColumnCount(1);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columnCount;
}
