const fs = require('fs');
const db = require('better-sqlite3')('D:/ProductionStatisticsManager/database/production.db');
const rows = db.prepare(SELECT full_name, representative_code FROM employees WHERE status = 'Ðang làm vi?c' ORDER BY representative_code).all();
const out = rows.map(r => r.representative_code + ' : ' + r.full_name).join('\n');
fs.writeFileSync('D:/MyProjects/ProductionStatisticsManager/employees_dump.txt', out);
process.exit(0);
