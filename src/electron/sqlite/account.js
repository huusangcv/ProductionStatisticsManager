const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

function getDatabasePath() {
  return path.join(
    app.getPath("userData"),
    "database",
    "production-statistics.sqlite",
  );
}

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Creates the app_account table if it does not exist.
 * Inserts the default account if no account exists.
 * The table must always contain exactly one record.
 */
function ensureAppAccount() {
  const db = openDatabase();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_account (
        id         INTEGER PRIMARY KEY CHECK (id = 1),
        username   TEXT    NOT NULL,
        password   TEXT    NOT NULL,
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const existing = db.prepare("SELECT id FROM app_account WHERE id = 1").get();

    if (!existing) {
      db.prepare(
        "INSERT INTO app_account (id, username, password) VALUES (1, ?, ?)",
      ).run(DEFAULT_USERNAME, DEFAULT_PASSWORD);
    }
  } finally {
    db.close();
  }
}

/**
 * Validates username and password against the stored account.
 * Returns { ok: true } on success or { ok: false, message } on failure.
 */
function validateLogin(username, password) {
  const db = openDatabase();

  try {
    const account = db
      .prepare("SELECT username, password FROM app_account WHERE id = 1")
      .get();

    if (!account) {
      return { ok: false, message: "Tài khoản chưa được thiết lập." };
    }

    if (account.username !== username || account.password !== password) {
      return { ok: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    return { ok: true };
  } finally {
    db.close();
  }
}

/**
 * Returns the stored account (without password).
 * Used by the Settings module to display current username.
 */
function getAccount() {
  const db = openDatabase();

  try {
    const account = db
      .prepare("SELECT id, username, updated_at FROM app_account WHERE id = 1")
      .get();

    return account ?? null;
  } finally {
    db.close();
  }
}

/**
 * Updates the username and/or password.
 * Always updates the single existing account record.
 */
function updateAccount({ username, password }) {
  const db = openDatabase();

  try {
    db.prepare(
      `UPDATE app_account
         SET username   = ?,
             password   = ?,
             updated_at = datetime('now')
       WHERE id = 1`,
    ).run(username, password);

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureAppAccount,
  validateLogin,
  getAccount,
  updateAccount,
};
