import { createContext, useContext, useState, useEffect, useCallback } from "react";

const UpdateContext = createContext(null);

export function UpdateProvider({ children }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("idle"); // idle | checking | available | not-available | downloading | downloaded | error

  useEffect(() => {
    if (!window.electronAPI?.update) return;

    window.electronAPI.update.onStatus((data) => {
      setUpdateStatus(data.status);
    });

    window.electronAPI.update.onAvailable((info) => {
      setUpdateAvailable(true);
      setUpdateInfo(info);
      setUpdateStatus("available");
    });

    window.electronAPI.update.onNotAvailable(() => {
      setUpdateAvailable(false);
      setUpdateInfo(null);
      setUpdateStatus("not-available");
    });

    window.electronAPI.update.onError((err) => {
      setUpdateError(err);
      setUpdateStatus("error");
    });

    window.electronAPI.update.onProgress((progress) => {
      setDownloadProgress(progress);
      setUpdateStatus("downloading");
    });

    window.electronAPI.update.onDownloaded((info) => {
      setUpdateDownloaded(true);
      setUpdateStatus("downloaded");
      setDownloadProgress(null);
    });

    return () => {
      if (window.electronAPI?.update?.removeAllListeners) {
        window.electronAPI.update.removeAllListeners();
      }
    };
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!window.electronAPI?.update) return;
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      await window.electronAPI.update.check();
    } catch (err) {
      setUpdateError(err.message);
      setUpdateStatus("error");
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!window.electronAPI?.update) return;
    try {
      await window.electronAPI.update.download();
    } catch (err) {
      setUpdateError(err.message);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!window.electronAPI?.update) return;
    await window.electronAPI.update.install();
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        updateAvailable,
        updateInfo,
        updateDownloaded,
        downloadProgress,
        updateError,
        updateStatus,
        checkForUpdate,
        downloadUpdate,
        installUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error("useUpdate must be used within UpdateProvider");
  return ctx;
}
