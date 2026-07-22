const ExcelJS = require('exceljs');

async function checkTemplate() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('D:/ProductionStatisticsManager/templates/casting-defect-return.xlsx');
  const sheet = workbook.worksheets[0];
  console.log('Row 8 cell H:', sheet.getCell('H8').value);
  console.log('Row 41 cell C:', sheet.getCell('C41').value);
}
checkTemplate();
