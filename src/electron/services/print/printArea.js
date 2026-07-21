/**
 * printArea.js — Generates the PowerShell snippet that detects the actual
 * last row of a worksheet and sets the PrintArea using configured columns.
 *
 * Column detection has been REMOVED from this module.
 * The print column range (startColumn, endColumn) is now always read from
 * the database (excel_templates.print_start_column / print_end_column)
 * and passed in by the orchestrator (excelPrinter.js).
 *
 * Strategy for LastRow detection:
 *   1. Primary:  Cells.Find("*", SearchOrder=xlByRows, xlPrevious)
 *                to find the true last row.
 *   2. Fallback: ws.UsedRange if Find returns $null (empty sheet).
 *
 * LOG lines written by the snippet (parsed by orchestrator):
 *   LOG:StartColumn=<col>
 *   LOG:EndColumn=<col>
 *   LOG:LastRow=<n>
 *   LOG:PrintArea=<range>
 *   LOG:UsedRange_Fallback=true   (only if Find returned null)
 */

"use strict";

/**
 * Returns the PowerShell snippet (string) that detects LastRow and sets
 * PrintArea using the provided column range.
 *
 * The caller must declare `$ws` before this snippet.
 *
 * @param {object} options
 * @param {string} options.startColumn  e.g. "A"
 * @param {string} options.endColumn    e.g. "W"
 * @returns {string}  Multi-line PowerShell block.
 */
function buildDetectAndSetPrintAreaSnippet({ startColumn = "A", endColumn = "Z" } = {}) {
  const safeStart = (startColumn || "A").toUpperCase().trim();
  const safeEnd = (endColumn || "Z").toUpperCase().trim();

  return `
# ── Detect Last Row (column range is fixed from DB config) ────────────────────
$startColumn = "${safeStart}"
$endColumn   = "${safeEnd}"
Write-Output "LOG:StartColumn=$startColumn"
Write-Output "LOG:EndColumn=$endColumn"

$xlByRows    = 1
$xlPrevious  = 2

# Find last row using xlByRows + xlPrevious direction
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

if ($lastRowCell -eq $null) {
  # Fallback to UsedRange
  $lastRow = $ws.UsedRange.Rows.Count + $ws.UsedRange.Row - 1
  Write-Output "LOG:UsedRange_Fallback=true"
} else {
  $lastRow = $lastRowCell.Row
}

Write-Output "LOG:LastRow=$lastRow"

# Build Print Area from configured columns + detected last row
# Note: "1" is a literal suffix for the start row; using string concatenation avoids PS quoting issues
$printArea = $startColumn + "1:" + $endColumn + $lastRow
$ws.PageSetup.PrintArea = $printArea
Write-Output "LOG:PrintArea=$printArea"
`;
}

/**
 * Parses LOG lines from PowerShell stdout to extract print area diagnostics.
 *
 * @param {string} stdout
 * @returns {{
 *   startColumn: string|null,
 *   endColumn: string|null,
 *   lastRow: string|null,
 *   printArea: string|null,
 *   usedRangeFallback: boolean,
 * }}
 */
function parsePrintAreaLogs(stdout) {
  const result = {
    startColumn: null,
    endColumn: null,
    lastRow: null,
    printArea: null,
    usedRangeFallback: false,
  };
  if (!stdout) return result;

  for (const line of stdout.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith("LOG:StartColumn=")) result.startColumn = t.split("=")[1];
    else if (t.startsWith("LOG:EndColumn=")) result.endColumn = t.split("=")[1];
    else if (t.startsWith("LOG:LastRow=")) result.lastRow = t.split("=")[1];
    else if (t.startsWith("LOG:PrintArea=")) result.printArea = t.split("=").slice(1).join("=");
    else if (t.startsWith("LOG:UsedRange_Fallback=true")) result.usedRangeFallback = true;
  }
  return result;
}

module.exports = { buildDetectAndSetPrintAreaSnippet, parsePrintAreaLogs };
