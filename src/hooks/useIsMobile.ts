import { useEffect, useState } from 'react';

const QUERY = '(max-width: 768px)';

/**
 * Returns true when the viewport matches mobile breakpoint (≤768px).
 * Listens for changes so the UI can swap between Sider and Drawer.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
