const { openDatabase } = require("./connection");
const { getDatabasePath } = require("./paths");
const logger = require("../logger");

function getDatabase() {
  return openDatabase();
}

function ensureAttendanceTable() {
  const db = getDatabase();
  try {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'").get();

    if (!tableInfo) {
      db.exec(`
        CREATE TABLE attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          work_date TEXT NOT NULL,
          employee_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'NOT_CHECKED',
          note TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(work_date, employee_id),
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
      `);
    } else {
      const columns = db.prepare("PRAGMA table_info(attendance)").all();
      const hasWorkDate = columns.some((col) => col.name === "work_date");
      const hasDate = columns.some((col) => col.name === "date");

      if (!hasWorkDate && hasDate) {
        db.transaction(() => {
          db.exec("ALTER TABLE attendance RENAME TO attendance_old");
          db.exec(`
            CREATE TABLE attendance (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              work_date TEXT NOT NULL,
              employee_id INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'NOT_CHECKED',
              note TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(work_date, employee_id),
              FOREIGN KEY (employee_id) REFERENCES employees(id)
            );
          `);
          db.exec(`
            INSERT INTO attendance (work_date, employee_id, status, note, created_at, updated_at)
            SELECT date AS work_date, employee_id, status, note, created_at, updated_at
            FROM attendance_old
          `);
          db.exec("DROP TABLE attendance_old");
        })();
      } else if (!hasWorkDate) {
        db.exec("ALTER TABLE attendance ADD COLUMN work_date TEXT");
      }
    }

    db.exec(`CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance(work_date);`);
    logger.info("attendance table ensured");
  } catch (err) {
    logger.error("Error ensuring attendance table:", err);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Lấy danh sách điểm danh của ngày. 
 * Nếu nhân viên chưa có record sẽ trả về trạng thái mặc định NOT_CHECKED.
 * Dedup theo representative_code: khi 1 người có nhiều vai trò (nhiều bản ghi employee),
 * chỉ hiển thị 1 lần (ưu tiên bản ghi có id nhỏ nhất — thêm vào trước).
 */
function getAttendanceByDate(date) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      SELECT 
        e.id as employee_id, 
        e.employee_code, 
        e.full_name as employee_name, 
        r.code as role_code, 
        e.representative_code,
        CASE WHEN e.status = 'Đang làm việc' THEN 1 ELSE 0 END as is_active,
        COALESCE(a.status, 'NOT_CHECKED') as status,
        a.note,
        a.id as attendance_id,
        a.updated_at
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.work_date = ?
      WHERE e.status = 'Đang làm việc'
        AND e.id = (
          SELECT MIN(e2.id)
          FROM employees e2
          WHERE e2.representative_code = e.representative_code
            AND e2.status = 'Đang làm việc'
        )
      ORDER BY e.representative_code ASC, e.employee_code ASC
    `);
    return stmt.all(date);
  } catch (err) {
    logger.error("Error getting attendance by date:", err);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Cập nhật điểm danh hàng loạt cho 1 ngày
 * records: [{ employee_id, status, note }]
 */
function upsertAttendanceBatch(date, records) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO attendance (work_date, employee_id, status, note, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(work_date, employee_id) DO UPDATE SET
        status = excluded.status,
        note = excluded.note,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    db.transaction(() => {
      for (const record of records) {
        stmt.run(date, record.employee_id, record.status, record.note || "");
      }
    })();
    return true;
  } catch (err) {
    logger.error("Error upserting attendance batch:", err);
    throw err;
  } finally {
    db.close();
  }
}

/**
 * Kiểm tra xem ngày hôm nay còn bao nhiêu nhân viên chưa điểm danh.
 * Dedup theo representative_code để không đếm 2 lần nhân viên đa vai trò.
 */
function checkMissingAttendance(date) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      SELECT COUNT(e.id) as missing_count
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND a.work_date = ?
      WHERE e.status = 'Đang làm việc'
        AND (a.id IS NULL OR a.status = 'NOT_CHECKED')
        AND e.id = (
          SELECT MIN(e2.id)
          FROM employees e2
          WHERE e2.representative_code = e.representative_code
            AND e2.status = 'Đang làm việc'
        )
    `);
    const result = stmt.get(date);
    return result ? result.missing_count : 0;
  } catch (err) {
    logger.error("Error checking missing attendance:", err);
    throw err;
  } finally {
    db.close();
  }
}

module.exports = {
  ensureAttendanceTable,
  getAttendanceByDate,
  upsertAttendanceBatch,
  checkMissingAttendance
};
