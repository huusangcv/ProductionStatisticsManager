import { createContext, useContext, useState } from "react";

const AppLockContext = createContext(null);

/**
 * AppLockProvider
 *
 * Provides application-wide lock state.
 * When isLocked=true, AppLockGate (in AppRoutes) renders ApplicationLockedView
 * instead of any normal page, effectively blocking the entire UI.
 *
 * Lock can only be set to true by a successful remote check returning locked=true.
 * Unlock only happens when remote check returns locked=false (via re-check or restart).
 *
 * NOT automatically cleared on network errors — follows the cache policy of
 * remoteLockService (last confirmed locked=true persists offline).
 */
export function AppLockProvider({ children }) {
  const [isLocked, setIsLocked]     = useState(false);
  const [lockScreen, setLockScreen] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Get initial cached status from backend
    window.electronAPI.remoteLock.getStatus().then((status) => {
      if (status.locked) {
        setIsLocked(true);
        setLockScreen(status.lockScreen);
        
        // 2. If it's locked, we MUST check GitHub to see if it was unlocked.
        // Otherwise, the user can never click 'Điểm danh' to trigger a check.
        window.electronAPI.remoteLock.check().then((checkStatus) => {
          if (!checkStatus.locked) {
            setIsLocked(false);
            setLockScreen(null);
          } else {
            setLockScreen(checkStatus.lockScreen);
          }
        }).catch(() => {
          // Ignore network errors, it stays locked per cache policy
        });
      }
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return null; // Wait for initial status before rendering routes
  }


  /**
   * setLocked(lockScreenData)
   * Call when remote check returns locked=true.
   * lockScreenData is the lockScreen object from remote-config.json (may be null).
   */
  function setLocked(lockScreenData) {
    setIsLocked(true);
    setLockScreen(lockScreenData || null);
  }

  /**
   * clearLock()
   * Call when remote check returns locked=false after a previous locked state.
   * NOT called automatically — only by an explicit successful remote re-check.
   */
  function clearLock() {
    setIsLocked(false);
    setLockScreen(null);
  }

  return (
    <AppLockContext.Provider value={{ isLocked, lockScreen, setLocked, clearLock }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error("useAppLock must be used within AppLockProvider");
  return ctx;
}
