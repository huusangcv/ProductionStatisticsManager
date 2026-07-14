const { getAllSessions } = require('./src/electron/sqlite/importSessions.js');
try {
  console.log(getAllSessions());
} catch (e) {
  console.error("ERROR:", e);
}
