const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

/**
 * Creates and returns a new Database connection with PRAGMAs configured.
 * It's important to set foreign_keys = ON on every connection.
 */
function openDatabase() {
  const db = new Database(getDatabasePath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

module.exports = { openDatabase };
