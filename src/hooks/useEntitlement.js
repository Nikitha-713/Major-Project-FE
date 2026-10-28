import { useEffect, useState, useCallback } from 'react';
import axios from '../axiosInstance';

// UI hint only. The server is always the enforcer.
export default function useEntitlement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setData((await axios.get('/entitlements/me')).data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const hasFlag = (name) => !!data?.features?.[name];
  const capReached = (capName, usageKey) => {
    const limit = data?.caps?.[capName];
    return limit !== undefined && limit !== -1 && (data?.usage?.[usageKey] ?? 0) >= limit;
  };

  return { data, loading, refresh, hasFlag, capReached };
}

// Helper: is this API error an upgrade-required response?
export const isUpgradeError = (err) => err?.response?.status === 403 && err.response.data?.code === 'UPGRADE_REQUIRED';
