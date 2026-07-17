const { screen } = require("electron");

const LOGIN_MODE = {
  width: 980,
  height: 620,
  minWidth: 980,
  minHeight: 620,
};

const APP_MODE = {
  width: 1600,
  height: 900,
  minWidth: 1366,
  minHeight: 768,
};

function applyLoginMode(win) {
  if (!win || win.isDestroyed()) return { ok: false };

  if (win.isMaximized()) win.unmaximize();
  if (win.isFullScreen()) win.setFullScreen(false);

  win.setResizable(false);
  win.setMaximizable(false);
  win.setFullScreenable(false);
  win.setMinimumSize(LOGIN_MODE.minWidth, LOGIN_MODE.minHeight);
  win.setMaximumSize(LOGIN_MODE.width, LOGIN_MODE.height);
  win.setSize(LOGIN_MODE.width, LOGIN_MODE.height);
  win.center();

  return { ok: true, mode: "login" };
}

function applyApplicationMode(win) {
  if (!win || win.isDestroyed()) return { ok: false };

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  if (win.isMaximized()) win.unmaximize();
  if (win.isFullScreen()) win.setFullScreen(false);

  win.setMaximumSize(screenW, screenH);
  win.setMinimumSize(APP_MODE.minWidth, APP_MODE.minHeight);
  win.setResizable(true);
  win.setMaximizable(true);
  win.setFullScreenable(false);

  const targetW = Math.min(APP_MODE.width, screenW);
  const targetH = Math.min(APP_MODE.height, screenH);
  win.setSize(targetW, targetH);
  win.center();

  return { ok: true, mode: "application" };
}

module.exports = {
  LOGIN_MODE,
  APP_MODE,
  applyLoginMode,
  applyApplicationMode,
};
