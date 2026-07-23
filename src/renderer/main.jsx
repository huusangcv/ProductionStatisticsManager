import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import AppThemeProvider from "./theme/AppThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import { UpdateProvider } from "./context/UpdateContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AuthProvider>
        <UpdateProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </UpdateProvider>
      </AuthProvider>
    </AppThemeProvider>
  </React.StrictMode>,
);
