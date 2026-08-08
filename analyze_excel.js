const XLSX = require("xlsx");
const path = require("path");

function analyzeExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to see headers and first 3 rows
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    console.log(`\n--- File: ${path.basename(filePath)} ---`);
    console.log(`Rows count: ${data.length}`);
    if (data.length > 0) {
      console.log("Headers:", Object.keys(data[0]));
      console.log("First row:", data[0]);
    }
  } catch (err) {
    console.error("Error reading", filePath, err);
  }
}

analyzeExcel("d:\\MyProjects\\ProductionStatisticsManager\\src\\excels\\lò 28.07.xls");
analyzeExcel("d:\\MyProjects\\ProductionStatisticsManager\\src\\excels\\cắt 28.07.xls");
