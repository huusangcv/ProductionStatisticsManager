import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;
  const listenersAttached = useRef(false);

  // Load initial data
  const loadNotifications = useCallback(async (reset = true) => {
    if (!window.electronAPI?.notifications) return;
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const result = await window.electronAPI.notifications.getAll({ limit: LIMIT, offset: currentOffset });
      if (result.ok) {
        setNotifications(reset ? result.data : (prev) => [...prev, ...result.data]);
        setTotal(result.total);
        if (reset) setOffset(LIMIT);
        else setOffset(currentOffset + LIMIT);
      }
    } finally {
      setLoading(false);
    }
  }, [offset]);

  const refreshUnreadCount = useCallback(async () => {
    if (!window.electronAPI?.notifications) return;
    const count = await window.electronAPI.notifications.getUnreadCount();
    setUnreadCount(typeof count === "number" ? count : 0);
  }, []);

  // Attach IPC listeners once
  useEffect(() => {
    if (listenersAttached.current || !window.electronAPI?.notifications) return;
    listenersAttached.current = true;

    window.electronAPI.notifications.onNew((item) => {
      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setTotal((prev) => prev + 1);
    });

    return () => {
      window.electronAPI?.notifications?.removeAllListeners?.();
    };
  }, []);

  // Load on first mount
  useEffect(() => {
    loadNotifications(true);
    refreshUnreadCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = useCallback(async (id) => {
    if (!window.electronAPI?.notifications) return;
    await window.electronAPI.notifications.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!window.electronAPI?.notifications) return;
    await window.electronAPI.notifications.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    if (!window.electronAPI?.notifications) return;
    await window.electronAPI.notifications.delete(id);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (removed && !removed.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
    setTotal((prev) => prev - 1);
  }, []);

  const deleteAll = useCallback(async () => {
    if (!window.electronAPI?.notifications) return;
    await window.electronAPI.notifications.deleteAll();
    setNotifications([]);
    setUnreadCount(0);
    setTotal(0);
    setOffset(0);
  }, []);

  const loadMore = useCallback(async () => {
    await loadNotifications(false);
  }, [loadNotifications]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        total,
        loading,
        drawerOpen,
        hasMore: notifications.length < total,
        openDrawer,
        closeDrawer,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAll,
        loadMore,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
