const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");
const { ensureAppAccount } = require("./account");

function initializeDatabase() {
  const dataDirectory = path.join(app.getPath("userData"), "database");
  const databasePath = path.join(dataDirectory, "production-statistics.sqlite");

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.close();

  // Seed single application account on first startup.
  ensureAppAccount();

  return databasePath;
}

module.exports = {
  initializeDatabase,
};
