// src/hooks/useStoreZoneSync.js
//
// Super admin dashboard: polls the server and reports store delivery polygons that
// were created / edited (by a store admin OR the super admin) since the last check.
// No websockets needed - it is cheap (only changed stores are returned) and pauses
// while the browser tab is hidden.
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';

export function useStoreZoneSync({ enabled = true, intervalMs = 8000, onChange } = {}) {
  const sinceRef = useRef(null);        // ISO time of the last successful sync
  const onChangeRef = useRef(onChange); // always call the latest callback
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const sync = useCallback(async () => {
    const res = await apiService.getStoreZones(sinceRef.current);
    if (!res || res.success === false) {
      setError(res?.message || res?.error || 'Sync failed');
      return;
    }
    setError(null);
    // First call returns everything (no `since`), later calls only the changes.
    const wasInitial = !sinceRef.current;
    // Using the SERVER clock avoids problems when the browser clock is wrong.
    sinceRef.current = res.serverTime || new Date().toISOString();
    setLastSync(new Date());
    if (Array.isArray(res.stores) && res.stores.length > 0 && onChangeRef.current) {
      onChangeRef.current(res.stores, { initial: wasInitial });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      if (!document.hidden) {
        try {
          await sync();
        } catch (e) {
          setError(e.message);
        }
      }
      timer = setTimeout(tick, intervalMs);
    };
    tick();

    const onVisible = () => {
      if (!document.hidden) sync().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, intervalMs, sync]);

  return { lastSync, error, refresh: sync };
}
