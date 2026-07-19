/**
 * productionBase.js — Generic DAO factory for production modules.
 */

const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

/**
 * Builds a comma-separated SQL column definition string from a column spec.
 * Maps column type to SQLite type (TEXT, INTEGER, REAL).
 */
function buildColumnDefinitions(columnSpec) {
  return columnSpec
    .map((col) => {
      let sqlType = "TEXT";
      if (col.type === "number" || col.type === "integer") sqlType = "INTEGER";
      if (col.type === "float") sqlType = "REAL";
      return `        ${col.databaseField.padEnd(30)} ${sqlType}`;
    })
    .join(",\n");
}

function buildCreateTableSql(tableName, columnSpec) {
  const colDefs = buildColumnDefinitions(columnSpec);
  return `
        CREATE TABLE ${tableName} (
          id                            INTEGER PRIMARY KEY AUTOINCREMENT,
${colDefs},
          import_session_id             INTEGER,
          imported_at                   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
      `;
}

function hasDedupUniqueIndex(db, tableName) {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all();
  return indexes.some((idx) => idx.unique === 1 && idx.origin === "u");
}

/**
 * Existing databases may still carry the old dedup UNIQUE constraint.
 * Recreate the table without it so every Excel row can be inserted.
 */
function migrateRemoveDedupConstraint(db, tableName, columnSpec) {
  if (!hasDedupUniqueIndex(db, tableName)) return;

  const tempTable = `${tableName}_no_dedup`;
  const columns = [
    "id",
    ...columnSpec.map((c) => c.databaseField),
    "import_session_id",
    "imported_at",
  ].join(", ");

  db.exec(`DROP TABLE IF EXISTS ${tempTable}`);
  db.exec(buildCreateTableSql(tempTable, columnSpec));
  db.exec(
    `INSERT INTO ${tempTable} (${columns}) SELECT ${columns} FROM ${tableName}`,
  );
  db.exec(`DROP TABLE ${tableName}`);
  db.exec(`ALTER TABLE ${tempTable} RENAME TO ${tableName}`);
}

// Helper to calculate joint count (only for cutting_production)
function calculateJointCount(db, record) {
  if (!record.material_code || !record.completed_quantity) return 0;

  // Get detail from detail_joint table by material_code
  const detailRow = db
    .prepare("SELECT detail FROM detail_joint WHERE material_code = ? LIMIT 1")
    .get(record.material_code);

  const quantity = Number(record.completed_quantity || 0);
  const detail = Number(detailRow?.detail || 0);

  if (detail > 0) {
    return Math.ceil(quantity / detail);
  } else {
    return 0;
  }
}

/**
 * Creates a production DAO module for a given table and column specification.
 * @param {string} tableName - e.g. "grinding_production" or "cutting_production"
 * @param {Array}  columnSpec - from grindingColumns.js / cuttingColumns.js
 */
function createProductionModule(tableName, columnSpec) {
  const dbFields = columnSpec.map((c) => c.databaseField);

  // ── ensureTable ──────────────────────────────────────────────────────────
  function ensureTable() {
    const db = openDatabase();
    try {
      const tableExists = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName);

      if (tableExists) {
        migrateRemoveDedupConstraint(db, tableName, columnSpec);
      } else {
        db.exec(buildCreateTableSql(tableName, columnSpec));
      }

      // Migration: Add import_session_id to existing tables
      const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const hasSessionId = columns.some(
        (col) => col.name === "import_session_id",
      );
      if (!hasSessionId) {
        db.exec(
          `ALTER TABLE ${tableName} ADD COLUMN import_session_id INTEGER`,
        );
      }

      // Migration: Convert report_date from dd/MM/yyyy to YYYY-MM-DD if needed
      const hasReportDate = columns.some((col) => col.name === "report_date");
      if (hasReportDate) {
        const rows = db
          .prepare(
            `SELECT id, report_date FROM ${tableName} WHERE report_date LIKE '%/%'`,
          )
          .all();
        for (const row of rows) {
          const [day, month, year] = row.report_date.split("/");
          if (day && month && year) {
            const newDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            db.prepare(
              `UPDATE ${tableName} SET report_date = ? WHERE id = ?`,
            ).run(newDate, row.id);
          }
        }
      }

      // Migration: Add joint_count to cutting_production table
      if (tableName === "cutting_production") {
        const hasJointCount = columns.some((col) => col.name === "joint_count");
        if (!hasJointCount) {
          db.exec(
            `ALTER TABLE ${tableName} ADD COLUMN joint_count INTEGER DEFAULT 0`,
          );
        }
      }
    } finally {
      db.close();
    }
  }

  // ── getAll ───────────────────────────────────────────────────────────────
  function getAll() {
    const db = openDatabase();
    try {
      return db
        .prepare(
          `
          SELECT 
            p.*,
            (SELECT dj.detail 
             FROM detail_joint dj 
             WHERE dj.material_code = p.material_code 
             LIMIT 1) AS joint_detail
          FROM ${tableName} p
          ORDER BY p.imported_at DESC
        `,
        )
        .all();
    } finally {
      db.close();
    }
  }

  // ── checkExistsByDate ────────────────────────────────────────────────────
  function checkExistsByDate(date) {
    const db = openDatabase();
    try {
      const row = db
        .prepare(`SELECT 1 FROM ${tableName} WHERE report_date = ? LIMIT 1`)
        .get(date);
      return !!row;
    } finally {
      db.close();
    }
  }

  // ── deleteByDate ─────────────────────────────────────────────────────────
  function deleteByDate(date) {
    const db = openDatabase();
    try {
      db.prepare(`DELETE FROM ${tableName} WHERE report_date = ?`).run(date);
    } finally {
      db.close();
    }
  }

  // ── getById ─────────────────────────────────────────────────────────────
  function getById(id) {
    const db = openDatabase();
    try {
      return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
    } finally {
      db.close();
    }
  }

  // ── update ─────────────────────────────────────────────────────────────
  function update(id, data) {
    const db = openDatabase();
    try {
      let updateFields = dbFields.map((field) => `${field} = @${field}`);

      if (tableName === "cutting_production") {
        updateFields = [...updateFields, "joint_count = @joint_count"];
      }

      const updateData = { ...data, id };

      if (tableName === "cutting_production") {
        // Get current material_code from DB if not provided in data
        let recordToCalculate = { ...data };
        if (!recordToCalculate.material_code) {
          const currentRecord = db
            .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
            .get(id);
          if (currentRecord) {
            recordToCalculate.material_code = currentRecord.material_code;
          }
        }
        // Ensure completed_quantity is present
        if (!recordToCalculate.completed_quantity) {
          const currentRecord = db
            .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
            .get(id);
          if (currentRecord) {
            recordToCalculate.completed_quantity =
              currentRecord.completed_quantity;
          }
        }

        updateData.joint_count = calculateJointCount(db, recordToCalculate);
      }

      const result = db
        .prepare(
          `
        UPDATE ${tableName} 
        SET ${updateFields.join(", ")}
        WHERE id = @id
      `,
        )
        .run(updateData);

      if (result.changes === 0) {
        return { ok: false, message: `Không tìm thấy bản ghi với id ${id}.` };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      db.close();
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────
  function deleteById(id) {
    const db = openDatabase();
    try {
      const result = db
        .prepare(`DELETE FROM ${tableName} WHERE id = ?`)
        .run(id);
      if (result.changes === 0) {
        return { ok: false, message: `Không tìm thấy bản ghi với id ${id}.` };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      db.close();
    }
  }

  // ── importData ───────────────────────────────────────────────────────────
  function importData(records, sessionId) {
    const db = openDatabase();
    try {
      // Prepare insert statement, add joint_count if cutting_production
      let insertFields = [...dbFields, "import_session_id"];
      let placeholders = dbFields
        .map((f) => `@${f}`)
        .concat(["@import_session_id"]);

      if (tableName === "cutting_production") {
        insertFields = [...insertFields, "joint_count"];
        placeholders = [...placeholders, "@joint_count"];
      }

      const insertData = db.prepare(`
        INSERT INTO ${tableName} (${insertFields.join(", ")})
        VALUES (${placeholders.join(", ")})
      `);

      const insertMany = db.transaction((rows) => {
        let insertedCount = 0;
        let failedCount = 0;

        for (const row of rows) {
          try {
            const rowWithSession = { ...row, import_session_id: sessionId };

            if (tableName === "cutting_production") {
              rowWithSession.joint_count = calculateJointCount(db, row);
            }

            const result = insertData.run(rowWithSession);
            insertedCount += result.changes;
          } catch {
            failedCount++;
          }
        }

        return { insertedCount, duplicateCount: 0, failedCount };
      });

      const counts = insertMany(records);
      return { ok: true, ...counts };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      db.close();
    }
  }

  return {
    ensureTable,
    getAll,
    getById,
    update,
    deleteById,
    checkExistsByDate,
    deleteByDate,
    importData,
  };
}

module.exports = { createProductionModule };
