const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, Menu } = require("electron");
const { registerIpcHandlers } = require("./ipc");
const { initializeDatabase } = require("./sqlite/init");

// ---------------------------------------------------------------------------
// Step 1: Configure userData path BEFORE app is ready.
// app.setPath must be called before app.whenReady() to take effect.
// ---------------------------------------------------------------------------

const PREFERRED_DATA_ROOT = "D:\\ProductionStatisticsManager";

function configureUserDataPath() {
  try {
    fs.accessSync("D:\\", fs.constants.W_OK);
    // Drive D is available — use dedicated folder
    app.setPath("userData", PREFERRED_DATA_ROOT);
  } catch {
    // Drive D not available — keep Electron default userData
  }
}

configureUserDataPath();

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 780,
    backgroundColor: "#f5f7fb",
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Thêm lắng nghe phím F11 để toggle maximize/restore
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.key === "F11") {
      event.preventDefault(); // Ngăn hành vi fullscreen mặc định của Electron/Chromium
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }


  mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  // mainWindow.webContents.openDevTools({ mode: "detach" });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpcHandlers();
  initializeDatabase();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
