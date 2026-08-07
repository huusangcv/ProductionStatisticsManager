import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/**
 * Parses stored currentAccount from localStorage safely.
 */
function loadCurrentAccount() {
  try {
    const raw = localStorage.getItem("currentAccount");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(loadCurrentAccount);

  const [savedUsername, setSavedUsername] = useState(() => {
    return localStorage.getItem("savedUsername") || "";
  });

  const login = async (username, password, rememberMe) => {
    try {
      // IPC returns { ok, id, username, role } on success
      const result = await window.electronAPI.auth.login({ username, password });

      if (result.ok) {
        const account = { id: result.id, username: result.username, role: result.role };
        setIsAuthenticated(true);
        setCurrentAccount(account);
        localStorage.setItem("currentAccount", JSON.stringify(account));

        if (rememberMe) {
          localStorage.setItem("savedUsername", username);
          setSavedUsername(username);
        } else {
          localStorage.removeItem("savedUsername");
          setSavedUsername("");
        }

        // Auto check for update silently in background after login
        setTimeout(() => {
          window.electronAPI?.update?.check?.().catch(() => {});
        }, 3000);

        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch {
      return { success: false, message: "Lỗi kết nối đến hệ thống." };
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setCurrentAccount(null);
    localStorage.removeItem("currentAccount");
    await window.electronAPI?.window?.setLoginMode?.();
  };

  /** Convenience: true if current user is ADMIN */
  const isAdmin = currentAccount?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        savedUsername,
        // Legacy: keep currentUser as username string for backward compat
        currentUser: currentAccount?.username ?? "",
        // New: full account object
        currentAccount,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
