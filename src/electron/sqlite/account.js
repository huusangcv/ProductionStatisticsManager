const { openDatabase } = require("./connection");

const DEFAULT_ADMIN = { username: "admin", password: "123456", role: "ADMIN" };

// ============================================================================
// Migration & Initialization
// ============================================================================

/**
 * Creates or migrates the app_account table.
 * - If table doesn't exist: create with multi-account schema (no CHECK id=1 constraint).
 * - If table exists without `role` column: ALTER TABLE to add it.
 * - If no accounts exist: seed the default admin account.
 */
function ensureAppAccount() {
  const db = openDatabase();

  try {
    // Check if table already exists
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='app_account'")
      .get();

    if (!tableExists) {
      // Fresh install — create new schema (no CHECK id=1)
      db.exec(`
        CREATE TABLE app_account (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          username   TEXT    NOT NULL UNIQUE,
          password   TEXT    NOT NULL,
          role       TEXT    NOT NULL DEFAULT 'STATISTIC',
          updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
      `);
    } else {
      // Existing install — migrate: add `role` column if missing
      const cols = db.prepare("PRAGMA table_info(app_account)").all();
      const hasRole = cols.some((c) => c.name === "role");
      if (!hasRole) {
        db.exec(`ALTER TABLE app_account ADD COLUMN role TEXT NOT NULL DEFAULT 'STATISTIC'`);
        // Upgrade existing account (id=1) to ADMIN
        db.prepare(`UPDATE app_account SET role = 'ADMIN' WHERE id = 1`).run();
      }
    }

    // Seed default admin if no accounts exist
    const count = db.prepare("SELECT COUNT(*) as cnt FROM app_account").get().cnt;
    if (count === 0) {
      db.prepare(
        "INSERT INTO app_account (username, password, role) VALUES (?, ?, ?)"
      ).run(DEFAULT_ADMIN.username, DEFAULT_ADMIN.password, DEFAULT_ADMIN.role);
    }
  } finally {
    db.close();
  }
}

// ============================================================================
// Auth
// ============================================================================

/**
 * Validates credentials. Returns { ok, id, username, role } on success.
 */
function validateLogin(username, password) {
  const db = openDatabase();
  try {
    const account = db
      .prepare("SELECT id, username, password, role FROM app_account WHERE username = ?")
      .get(username);

    if (!account) {
      return { ok: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }
    if (account.password !== password) {
      return { ok: false, message: "Tên đăng nhập hoặc mật khẩu không đúng." };
    }

    return { ok: true, id: account.id, username: account.username, role: account.role };
  } finally {
    db.close();
  }
}

// ============================================================================
// CRUD
// ============================================================================

/**
 * Returns all accounts (without password).
 */
function getAllAccounts() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT id, username, role, updated_at FROM app_account ORDER BY id").all();
  } finally {
    db.close();
  }
}

/**
 * Returns single account by id (without password).
 */
function getAccountById(id) {
  const db = openDatabase();
  try {
    return db
      .prepare("SELECT id, username, role, updated_at FROM app_account WHERE id = ?")
      .get(id) ?? null;
  } finally {
    db.close();
  }
}

/**
 * Creates a new account.
 */
function createAccount({ username, password, role }) {
  const db = openDatabase();
  try {
    const validRole = role === "ADMIN" ? "ADMIN" : "STATISTIC";
    const existing = db.prepare("SELECT id FROM app_account WHERE username = ?").get(username);
    if (existing) {
      return { ok: false, message: `Tên đăng nhập "${username}" đã tồn tại.` };
    }
    const result = db
      .prepare("INSERT INTO app_account (username, password, role) VALUES (?, ?, ?)")
      .run(username, password, validRole);
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Updates password for an account.
 */
function updatePassword(id, password) {
  const db = openDatabase();
  try {
    db.prepare(
      `UPDATE app_account SET password = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(password, id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Updates role for an account.
 */
function updateRole(id, role) {
  const db = openDatabase();
  try {
    const validRole = role === "ADMIN" ? "ADMIN" : "STATISTIC";
    db.prepare(
      `UPDATE app_account SET role = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(validRole, id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * Deletes an account by id. Prevents deleting the last ADMIN.
 */
function deleteAccount(id) {
  const db = openDatabase();
  try {
    const account = db.prepare("SELECT role FROM app_account WHERE id = ?").get(id);
    if (!account) return { ok: false, message: "Tài khoản không tồn tại." };

    if (account.role === "ADMIN") {
      const adminCount = db
        .prepare("SELECT COUNT(*) as cnt FROM app_account WHERE role = 'ADMIN'")
        .get().cnt;
      if (adminCount <= 1) {
        return { ok: false, message: "Không thể xóa tài khoản ADMIN duy nhất." };
      }
    }

    db.prepare("DELETE FROM app_account WHERE id = ?").run(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * @deprecated Legacy: used by old SettingsDialog. Keep for backward compat.
 * Updates username and password for account id=1.
 */
function updateAccount({ username, password }) {
  const db = openDatabase();
  try {
    db.prepare(
      `UPDATE app_account
         SET username   = ?,
             password   = ?,
             updated_at = datetime('now')
       WHERE id = 1`
    ).run(username, password);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

/**
 * @deprecated Legacy: returns first account without password.
 */
function getAccount() {
  const db = openDatabase();
  try {
    return db
      .prepare("SELECT id, username, role, updated_at FROM app_account WHERE id = 1")
      .get() ?? null;
  } finally {
    db.close();
  }
}

module.exports = {
  ensureAppAccount,
  validateLogin,
  getAllAccounts,
  getAccountById,
  createAccount,
  updatePassword,
  updateRole,
  deleteAccount,
  // Legacy
  getAccount,
  updateAccount,
};
