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
         ORDER BY id ASC`,
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
           WHERE id = ?`,
        )
        .get(id) ?? null
    );
  } finally {
    db.close();
  }
}

function createDetailJoint({
  material_code,
  product_name,
  specification,
  detail,
}) {
  const db = openDatabase();
  try {
    const result = db
      .prepare(
        `INSERT INTO detail_joint (material_code, product_name, specification, detail)
         VALUES (@material_code, @product_name, @specification, @detail)`,
      )
      .run({ material_code, product_name, specification, detail });

    // Recalculate joint_count for cutting_production with this material_code
    if (material_code) {
      const records = db
        .prepare(`SELECT * FROM cutting_production WHERE material_code = ?`)
        .all(material_code);
      const updateJointCountStmt = db.prepare(`
        UPDATE cutting_production 
        SET joint_count = ?
        WHERE id = ?
      `);

      for (const rec of records) {
        const quantity = Number(rec.completed_quantity || 0);
        const d = Number(detail || 0);
        let jointCount = 0;
        if (d > 0) {
          jointCount = Math.ceil(quantity / d);
        }
        updateJointCountStmt.run(jointCount, rec.id);
      }
    }

    return { ok: true, id: result.lastInsertRowid };
  } catch (error) {
    return { ok: false, message: error.message };
  } finally {
    db.close();
  }
}

function updateDetailJoint(
  id,
  { material_code, product_name, specification, detail },
) {
  const db = openDatabase();
  try {
    // First get the old material_code (in case it's being changed)
    const oldRecord = db
      .prepare(`SELECT * FROM detail_joint WHERE id = ?`)
      .get(id);
    if (!oldRecord) {
      return { ok: false, message: `Không tìm thấy dữ liệu với id ${id}.` };
    }

    // Update detail_joint
    const result = db
      .prepare(
        `UPDATE detail_joint
         SET material_code = @material_code,
             product_name = @product_name,
             specification = @specification,
             detail = @detail,
             updated_at = datetime('now')
         WHERE id = @id`,
      )
      .run({ id, material_code, product_name, specification, detail });
    if (result.changes === 0) {
      return { ok: false, message: `Không tìm thấy dữ liệu với id ${id}.` };
    }

    // Now recalculate joint_count for cutting_production records
    // Need to check old material_code (if changed) and new material_code
    const affectedMaterialCodes = new Set([
      oldRecord.material_code,
      material_code,
    ]);

    for (const mc of affectedMaterialCodes) {
      if (!mc) continue;

      // Get all cutting_production records with this material_code
      const records = db
        .prepare(`SELECT * FROM cutting_production WHERE material_code = ?`)
        .all(mc);

      // For each, calculate and update joint_count
      const updateJointCountStmt = db.prepare(`
        UPDATE cutting_production 
        SET joint_count = ?
        WHERE id = ?
      `);

      for (const rec of records) {
        // Calculate joint count
        let detailToUse = null;

        // Get detail from detail_joint for this material code
        const dj = db
          .prepare(
            `SELECT detail FROM detail_joint WHERE material_code = ? LIMIT 1`,
          )
          .get(mc);
        detailToUse = dj?.detail;

        const quantity = Number(rec.completed_quantity || 0);
        const d = Number(detailToUse || 0);
        let jointCount = 0;
        if (d > 0) {
          jointCount = Math.ceil(quantity / d);
        }

        updateJointCountStmt.run(jointCount, rec.id);
      }
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
    const oldRecord = db
      .prepare(`SELECT * FROM detail_joint WHERE id = ?`)
      .get(id);
    if (!oldRecord) {
      return { ok: false, message: `Không tìm thấy dữ liệu với id ${id}.` };
    }

    const result = db.prepare("DELETE FROM detail_joint WHERE id = ?").run(id);

    // Set joint_count to 0 for all cutting_production with this material_code
    if (oldRecord.material_code) {
      db.prepare(
        `
        UPDATE cutting_production 
        SET joint_count = 0 
        WHERE material_code = ?
      `,
      ).run(oldRecord.material_code);
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
       VALUES (@material_code, @product_name, @specification, @detail)`,
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
