/**
 * templateTypes.js — DAO for the template_types table.
 *
 * Defines dynamic types of excel templates (e.g. heat-treatment, production-report, defect-report).
 */

const Database = require("better-sqlite3");
const { getDatabasePath } = require("./paths");

function openDatabase() {
  return new Database(getDatabasePath());
}

function ensureTemplateTypesTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS template_types (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        code          TEXT    NOT NULL UNIQUE,
        description   TEXT,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active     INTEGER NOT NULL DEFAULT 1,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `);
  } finally {
    db.close();
  }
}

function seedTemplateTypesIfEmpty() {
  const db = openDatabase();
  try {
    const count = db.prepare("SELECT COUNT(*) as count FROM template_types").get().count;
    if (count === 0) {
      const stmt = db.prepare(`
        INSERT INTO template_types (id, name, code, display_order)
        VALUES (?, ?, ?, ?)
      `);
      
      const defaultTypes = [
        { id: 1, name: "Xử lý nhiệt", code: "heat-treatment", display_order: 10 },
        { id: 2, name: "Mẫu sản lượng", code: "production-template", display_order: 20 },
        { id: 3, name: "Báo cáo hàng lỗi", code: "defect-report", display_order: 30 }
      ];

      const insertMany = db.transaction((types) => {
        for (const type of types) {
          stmt.run(type.id, type.name, type.code, type.display_order);
        }
      });

      insertMany(defaultTypes);
    }
  } finally {
    db.close();
  }
}

function getAllActiveTemplateTypes() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM template_types WHERE is_active = 1 ORDER BY display_order ASC").all();
  } finally {
    db.close();
  }
}

function getAllTemplateTypes() {
  const db = openDatabase();
  try {
    return db.prepare("SELECT * FROM template_types ORDER BY display_order ASC, id ASC").all();
  } finally {
    db.close();
  }
}

function createTemplateType({ name, code, description, display_order = 0, is_active = 1 }) {
  const db = openDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO template_types (name, code, description, display_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, code, description, display_order, is_active);
    return { success: true, id: info.lastInsertRowid };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    db.close();
  }
}

function updateTemplateType(id, { name, code, description, display_order, is_active }) {
  const db = openDatabase();
  try {
    const stmt = db.prepare(`
      UPDATE template_types
      SET name = ?, code = ?, description = ?, display_order = ?, is_active = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);
    stmt.run(name, code, description, display_order, is_active, id);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteTemplateType(id) {
  const db = openDatabase();
  try {
    const stmt = db.prepare("DELETE FROM template_types WHERE id = ?");
    stmt.run(id);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureTemplateTypesTable,
  seedTemplateTypesIfEmpty,
  getAllActiveTemplateTypes,
  getAllTemplateTypes,
  createTemplateType,
  updateTemplateType,
  deleteTemplateType,
};
