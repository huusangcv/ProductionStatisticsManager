const ExcelJS = require('exceljs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  
  ws.getCell('A1').value = 1;
  ws.getCell('A2').value = 2;
  ws.getCell('A3').value = 3;
  
  ws.getCell('A4').value = { formula: 'IFERROR(H4-C4, "0")' };
  
  ws.spliceRows(2, 0, [], [], [], [], []);
  
  console.log("Formula after insert:", ws.getCell('A9').value.formula);
}
test();
