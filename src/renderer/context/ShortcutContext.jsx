/**
 * ShortcutContext.jsx
 *
 * A lightweight context that lets any page register Ctrl+P (print) and Ctrl+E
 * (export) handlers. The actual keyboard listener lives in AppLayout, which reads
 * from this context.
 *
 * Rules:
 *  - Only one handler per action at a time (the current page's handler).
 *  - Handlers are stored as refs to avoid stale closures.
 *  - Pages MUST unregister (pass null) in their useEffect cleanup.
 */

import { createContext, useContext, useRef, useCallback } from 'react';

const ShortcutContext = createContext(null);

export function ShortcutProvider({ children }) {
  // Each handler ref holds: null | () => void
  const printHandlerRef  = useRef(null);
  const exportHandlerRef = useRef(null);

  const registerPrint  = useCallback((fn) => { printHandlerRef.current  = fn; }, []);
  const registerExport = useCallback((fn) => { exportHandlerRef.current = fn; }, []);

  // Called by the keyboard listener in AppLayout
  const triggerPrint  = useCallback(() => { printHandlerRef.current?.();  }, []);
  const triggerExport = useCallback(() => { exportHandlerRef.current?.(); }, []);

  return (
    <ShortcutContext.Provider value={{ registerPrint, registerExport, triggerPrint, triggerExport }}>
      {children}
    </ShortcutContext.Provider>
  );
}

/** Use inside any page to register Ctrl+P / Ctrl+E handlers. */
export function useShortcut() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error('useShortcut must be used inside ShortcutProvider');
  return ctx;
}

/** Used by AppLayout to fire handlers when shortcuts are pressed. */
export function useShortcutTrigger() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error('useShortcutTrigger must be used inside ShortcutProvider');
  return { triggerPrint: ctx.triggerPrint, triggerExport: ctx.triggerExport };
}
