const ExcelJS = require('exceljs');
const path = require('path');

async function dump() {
  const wb = new ExcelJS.Workbook();
  const templatePath = path.join(__dirname, 'src', 'excels', 'hàng xln -.xlsx');
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];
  for(let i=1; i<=7; i++) {
    let row = [];
    ws.getRow(i).eachCell({includeEmpty: true}, cell => {
       row.push(cell.address + ':' + String(cell.value || '').replace(/\r?\n|\r/g, ' '));
    });
    console.log(`Row ${i}:`, row.join(' | '));
  }
}
dump();
