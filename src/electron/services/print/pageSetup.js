/**
 * pageSetup.js — Generates the PowerShell snippet that configures
 * PageSetup for printing.
 *
 * Targets:
 *   - PaperSize   = xlPaperA4 (9)
 *   - Orientation = xlLandscape (2)
 *   - Zoom        = $false  (required before setting FitToPages*)
 *   - FitToPagesWide = 1    (always fit horizontally to one page)
 *   - FitToPagesTall = $false (allow as many pages tall as needed)
 *   - Margins (Left/Right/Top/Bottom/Header/Footer) via CentimetersToPoints
 *   - PrintTitleRows if repeatHeaderRows is configured
 *
 * All values are set unconditionally on every print job — the template's
 * saved PageSetup is completely ignored.
 */

"use strict";

/**
 * Margin defaults in centimetres.
 * Override by passing `margins` option to buildPageSetupSnippet.
 */
const DEFAULT_MARGINS_CM = {
  left:   1.5,
  right:  1.5,
  top:    1.5,
  bottom: 1.5,
  header: 0.8,
  footer: 0.8,
};

/**
 * Generates the PowerShell snippet that fully configures PageSetup on `$ws`.
 *
 * The caller must declare `$xl` (Excel.Application) and `$ws` (Worksheet)
 * before this snippet.
 *
 * @param {object}       [options]
 * @param {string|null}  [options.repeatHeaderRows]  e.g. "1:5" or null
 * @param {object}       [options.margins]            Override margin values (in cm)
 * @returns {string}  Multi-line PowerShell block.
 */
function buildPageSetupSnippet({ repeatHeaderRows = null, margins = {} } = {}) {
  const m = { ...DEFAULT_MARGINS_CM, ...margins };

  const titleRowsLine = repeatHeaderRows
    ? `$ws.PageSetup.PrintTitleRows = "${ repeatHeaderRows }"`
    : `# PrintTitleRows: not configured for this module`;

  return `
# ── Page Setup ────────────────────────────────────────────────────────────────
# PaperSize: 9 = xlPaperA4
$ws.PageSetup.PaperSize    = 9
# Orientation: 2 = xlLandscape
$ws.PageSetup.Orientation  = 2
# Zoom must be $false before setting FitToPages*
$ws.PageSetup.Zoom         = $false
# Fit width to exactly 1 page; let height flow naturally
$ws.PageSetup.FitToPagesWide = 1
$ws.PageSetup.FitToPagesTall = $false
# Margins (centimetres → points)
$ws.PageSetup.LeftMargin   = $xl.CentimetersToPoints(${ m.left })
$ws.PageSetup.RightMargin  = $xl.CentimetersToPoints(${ m.right })
$ws.PageSetup.TopMargin    = $xl.CentimetersToPoints(${ m.top })
$ws.PageSetup.BottomMargin = $xl.CentimetersToPoints(${ m.bottom })
$ws.PageSetup.HeaderMargin = $xl.CentimetersToPoints(${ m.header })
$ws.PageSetup.FooterMargin = $xl.CentimetersToPoints(${ m.footer })
# Repeat header rows on every printed page
${titleRowsLine}
Write-Output "LOG:PageSetup=A4,Landscape,FitWidth=1,FitHeight=Auto"
Write-Output "LOG:Margins=L${m.left}_R${m.right}_T${m.top}_B${m.bottom}cm"
${repeatHeaderRows ? `Write-Output "LOG:PrintTitleRows=${repeatHeaderRows}"` : `Write-Output "LOG:PrintTitleRows=none"`}
`;
}

module.exports = { buildPageSetupSnippet, DEFAULT_MARGINS_CM };
