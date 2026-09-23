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
