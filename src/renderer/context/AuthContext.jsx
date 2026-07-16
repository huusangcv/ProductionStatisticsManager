import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedUsername, setSavedUsername] = useState(() => {
    return localStorage.getItem("savedUsername") || "";
  });

  const login = async (username, password, rememberMe) => {
    try {
      // Call IPC handler exposed via preload.js
      const result = await window.electronAPI.auth.login({ username, password });
      
      if (result.ok) {
        setIsAuthenticated(true);
        if (rememberMe) {
          localStorage.setItem("savedUsername", username);
          setSavedUsername(username);
        } else {
          localStorage.removeItem("savedUsername");
          setSavedUsername("");
        }
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch {
      return { success: false, message: "Lỗi kết nối đến hệ thống." };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, savedUsername }}>
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
