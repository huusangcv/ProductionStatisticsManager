import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing app accounts (CRUD via IPC).
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.auth.getAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("useAccounts: failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createAccount = useCallback(async (data) => {
    const result = await window.electronAPI.auth.createAccount(data);
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  const changePassword = useCallback(async (id, password) => {
    const result = await window.electronAPI.auth.updatePassword(id, password);
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  const changeRole = useCallback(async (id, role) => {
    const result = await window.electronAPI.auth.updateRole(id, role);
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  const removeAccount = useCallback(async (id) => {
    const result = await window.electronAPI.auth.deleteAccount(id);
    if (result.ok) await refresh();
    return result;
  }, [refresh]);

  return { accounts, loading, refresh, createAccount, changePassword, changeRole, removeAccount };
}
