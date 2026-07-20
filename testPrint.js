const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function testPrint() {
  const filePath = "D:\\ProductionStatisticsManager\\exports\\HeatTreatment\\2026\\07\\HangXuLyNhiet_20260720.xlsx";
  const printerName = "Canon LBP6030/6040/6018L (Copy 2)";

  const psScript = `
$ErrorActionPreference = "Stop"
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  try {
    $workbook = $excel.Workbooks.Open("${filePath.replace(/\\/g, "\\\\")}")
    try {
      ${printerName ? `$excel.ActivePrinter = "${printerName}"` : ""}
      $workbook.PrintOut()
      Write-Output "SUCCESS"
    } finally {
      $workbook.Close($false)
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
    }
  } finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  }
} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
  exit 1
}
`;
  console.log("Original Script:");
  console.log(psScript);

  const escapedScript = psScript.replace(/"/g, '\\"');
  console.log("\\nEscaped Script:");
  console.log(escapedScript);
  
  const cmd = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${escapedScript}"`;
  console.log("\\nCommand:");
  console.log(cmd);

  try {
    const { stdout, stderr } = await execAsync(cmd);
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);
  } catch (error) {
    console.error("Exec error:");
    console.error(error.message);
    if (error.stdout) console.error("stdout:", error.stdout);
    if (error.stderr) console.error("stderr:", error.stderr);
  }
}

testPrint();
