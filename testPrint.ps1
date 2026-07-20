$ErrorActionPreference = "Stop"
try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  try {
    $workbook = $excel.Workbooks.Open("D:\ProductionStatisticsManager\exports\HeatTreatment\2026\07\HangXuLyNhiet_20260720.xlsx")
    try {
      $excel.ActivePrinter = "Canon LBP6030/6040/6018L (Copy 2)"
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
