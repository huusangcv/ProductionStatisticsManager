import { useState, useCallback, useEffect } from "react";
import backupService from "../services/backupService";

export function useBackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const all = await backupService.list();
      setBackups(all);
    } catch (error) {
      console.error("Failed to fetch backups", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = useCallback(async () => {
    setLoading(true);
    try {
      const result = await backupService.create();
      if (result.ok) {
        await fetchBackups();
      }
      return result;
    } catch (error) {
      console.error("Failed to create backup", error);
      return { ok: false, message: "Lỗi không xác định" };
    } finally {
      setLoading(false);
    }
  }, [fetchBackups]);

  const restoreBackup = useCallback(async (backupPath) => {
    setLoading(true);
    try {
      const result = await backupService.restore(backupPath);
      if (result.ok) {
        await fetchBackups();
      }
      return result;
    } catch (error) {
      console.error("Failed to restore backup", error);
      return { ok: false, message: "Lỗi không xác định" };
    } finally {
      setLoading(false);
    }
  }, [fetchBackups]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return {
    backups,
    loading,
    fetchBackups,
    createBackup,
    restoreBackup,
  };
}
