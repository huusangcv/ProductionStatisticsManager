/**
 * printArea.js — Generates the PowerShell snippet that detects the actual
 * used range of a worksheet and sets the PrintArea accordingly.
 *
 * Strategy:
 *   1. Primary:  Cells.Find("*", SearchOrder=xlByRows/xlByColumns, xlPrevious)
 *                to find the true last row and last column.
 *   2. Fallback: ws.UsedRange if Find returns $null (empty sheet).
 *
 * The snippet writes LOG lines so the orchestrator can parse them:
 *   LOG:LastRow=<n>
 *   LOG:LastCol=<letter(s)>
 *   LOG:PrintArea=A1:<letter(s)><n>
 *
 * NOTE: Column address is derived from the cell address itself
 * ($ws.Cells($lastRow, $lastCol).Address(false,false)) so columns beyond Z
 * (AA, AB, …) are handled correctly without manual conversion.
 */

"use strict";

/**
 * Returns the PowerShell snippet (string) that detects UsedRange and sets
 * the PrintArea on the variable `$ws`.
 *
 * The caller is responsible for declaring `$ws` before this snippet.
 *
 * @returns {string}  Multi-line PowerShell block (no surrounding try/catch).
 */
function buildDetectAndSetPrintAreaSnippet() {
  return `
# ── Detect Used Range ─────────────────────────────────────────────────────────
$xlByRows    = 1
$xlByColumns = 2
$xlPrevious  = 2

# Find last row
$lastRowCell = $ws.Cells.Find(
  "*",
  $ws.Cells(1, 1),
  [System.Type]::Missing,
  [System.Type]::Missing,
  $xlByRows,
  $xlPrevious,
  [System.Type]::Missing,
  [System.Type]::Missing,
  [System.Type]::Missing
)

# Find last column
$lastColCell = $ws.Cells.Find(
  "*",
  $ws.Cells(1, 1),
  [System.Type]::Missing,
  [System.Type]::Missing,
  $xlByColumns,
  $xlPrevious,
  [System.Type]::Missing,
  [System.Type]::Missing,
  [System.Type]::Missing
)

if ($lastRowCell -eq $null -or $lastColCell -eq $null) {
  # Fallback to UsedRange
  $lastRow = $ws.UsedRange.Rows.Count + $ws.UsedRange.Row - 1
  $lastCol = $ws.UsedRange.Columns.Count + $ws.UsedRange.Column - 1
  Write-Output "LOG:UsedRange_Fallback=true"
} else {
  $lastRow = $lastRowCell.Row
  $lastCol = $lastColCell.Column
}

# Derive column letter(s) from the cell address itself (handles AA, AB, etc.)
$colAddress = $ws.Cells(1, $lastCol).Address($false, $false)
$colLetter  = $colAddress -replace "\\d+", ""

Write-Output "LOG:LastRow=$lastRow"
Write-Output "LOG:LastCol=$colLetter"

# Build and assign Print Area
$printArea = "A1:$colLetter$lastRow"
$ws.PageSetup.PrintArea = $printArea
Write-Output "LOG:PrintArea=$printArea"
`;
}

/**
 * Parses LOG lines from PowerShell stdout to extract print area diagnostics.
 *
 * @param {string} stdout
 * @returns {{ lastRow: string|null, lastCol: string|null, printArea: string|null, usedRangeFallback: boolean }}
 */
function parsePrintAreaLogs(stdout) {
  const result = {
    lastRow: null,
    lastCol: null,
    printArea: null,
    usedRangeFallback: false,
  };
  if (!stdout) return result;

  for (const line of stdout.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("LOG:LastRow="))      result.lastRow = t.split("=")[1];
    else if (t.startsWith("LOG:LastCol=")) result.lastCol = t.split("=")[1];
    else if (t.startsWith("LOG:PrintArea=")) result.printArea = t.split("=").slice(1).join("=");
    else if (t.startsWith("LOG:UsedRange_Fallback=true")) result.usedRangeFallback = true;
  }
  return result;
}

module.exports = { buildDetectAndSetPrintAreaSnippet, parsePrintAreaLogs };
