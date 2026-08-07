const fs = require('fs');
const path = require('path');
const db = require('better-sqlite3')('D:/ProductionStatisticsManager/database/production.db');
const rows = db.prepare(SELECT id, employee_code, full_name, representative_code FROM employees WHERE status = 'Ðang làm vi?c').all();
fs.writeFileSync('D:/MyProjects/ProductionStatisticsManager/test_db_output.json', JSON.stringify(rows, null, 2));
process.exit(0);
