const { getDatabasePath } = require("./paths");
const Database = require("better-sqlite3");

function openDatabase() {
  return new Database(getDatabasePath());
}

function ensureDetailJointTable() {
  const db = openDatabase();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS detail_joint (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_code TEXT NOT NULL,
        product_name TEXT NOT NULL,
        specification TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } finally {
    db.close();
  }
}

function getAllDetailJoints() {
  const db = openDatabase();
  try {
    return db
      .prepare(
        `SELECT id, material_code, product_name, specification, detail, created_at, updated_at
         FROM detail_joint
         ORDER BY id ASC`
      )
      .all();
  } finally {
    db.close();
  }
}

function getDetailJointById(id) {
  const db = openDatabase();
  try {
    return (
      db
        .prepare(
          `SELECT id, material_code, product_name, specification, detail, created_at, updated_at
           FROM detail_joint
           WHERE id = ?`
        )
        .get(id) ?? null
    );
  } finally {
    db.close();
  }
}

function createDetailJoint({ material_code, product_name, specification, detail }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO detail_joint (material_code, product_name, specification, detail)
         VALUES (@material_code, @product_name, @specification, @detail)`
      )
      .run({ material_code, product_name, specification, detail });
    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updateDetailJoint(id, { material_code, product_name, specification, detail }) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `UPDATE detail_joint
         SET material_code = @material_code,
             product_name = @product_name,
             specification = @specification,
             detail = @detail,
             updated_at = datetime('now')
         WHERE id = @id`
      )
      .run({ id, material_code, product_name, specification, detail });
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy dữ liệu với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteDetailJoint(id) {
  const db = openDatabase();
  try {
    const result = db.prepare("DELETE FROM detail_joint WHERE id = ?").run(id);
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy dữ liệu với id ${id}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function deleteAllDetailJoints() {
  const db = openDatabase();
  try {
    const result = db.prepare("DELETE FROM detail_joint").run();
    return { ok: true, changes: result.changes };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function bulkInsertDetailJoints(items) {
  const db = openDatabase();
  try {
    const insert = db.prepare(
      `INSERT INTO detail_joint (material_code, product_name, specification, detail)
       VALUES (@material_code, @product_name, @specification, @detail)`
    );
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
    });
    insertMany(items);
    return { ok: true, count: items.length };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

module.exports = {
  ensureDetailJointTable,
  getAllDetailJoints,
  getDetailJointById,
  createDetailJoint,
  updateDetailJoint,
  deleteDetailJoint,
  deleteAllDetailJoints,
  bulkInsertDetailJoints,
};
