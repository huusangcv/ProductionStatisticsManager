/**
 * pageSetup.js — Generates the PowerShell snippet that configures
 * PageSetup for printing, dynamically driven by DB configuration.
 */

"use strict";

const PAPER_SIZES = {
  "A4": 9,
  "A3": 8,
};

const ORIENTATIONS = {
  "portrait": 1,
  "landscape": 2,
};

/**
 * Generates the PowerShell snippet that fully configures PageSetup on `$ws`.
 *
 * @param {object} config Print configuration object containing page setup values.
 * @returns {string}  Multi-line PowerShell block.
 */
function buildPageSetupSnippet(config) {
  const paperSizeCode = PAPER_SIZES[config.paperSize] || 9;
  const orientationCode = ORIENTATIONS[config.orientation] || 2;
  
  const fitWidthLine = config.fitWidth !== null && config.fitWidth !== undefined 
    ? `$ws.PageSetup.FitToPagesWide = ${config.fitWidth}` 
    : `$ws.PageSetup.FitToPagesWide = $false`;
    
  const fitHeightLine = config.fitHeight !== null && config.fitHeight !== undefined 
    ? `$ws.PageSetup.FitToPagesTall = ${config.fitHeight}` 
    : `$ws.PageSetup.FitToPagesTall = $false`;

  const titleRowsLine = config.repeatHeaderRows
    ? `$ws.PageSetup.PrintTitleRows = "${config.repeatHeaderRows}"`
    : `# PrintTitleRows: not configured for this module`;

  return `
# ── Page Setup ────────────────────────────────────────────────────────────────
$ws.PageSetup.PaperSize    = ${paperSizeCode}
$ws.PageSetup.Orientation  = ${orientationCode}
$ws.PageSetup.Zoom         = $false
${fitWidthLine}
${fitHeightLine}
$ws.PageSetup.CenterHorizontally = $true
$ws.PageSetup.CenterVertically   = $false
$ws.PageSetup.LeftMargin   = $xl.CentimetersToPoints(${config.marginLeft})
$ws.PageSetup.RightMargin  = $xl.CentimetersToPoints(${config.marginRight})
$ws.PageSetup.TopMargin    = $xl.CentimetersToPoints(${config.marginTop})
$ws.PageSetup.BottomMargin = $xl.CentimetersToPoints(${config.marginBottom})
$ws.PageSetup.HeaderMargin = $xl.CentimetersToPoints(${config.headerMargin})
$ws.PageSetup.FooterMargin = $xl.CentimetersToPoints(${config.footerMargin})
${titleRowsLine}
Write-Output "LOG:PageSetup=${config.paperSize},${config.orientation},FitW=${config.fitWidth ?? 'auto'},FitH=${config.fitHeight ?? 'auto'}"
Write-Output "LOG:Margins=L${config.marginLeft}_R${config.marginRight}_T${config.marginTop}_B${config.marginBottom}cm"
Write-Output "LOG:PrintTitleRows=${config.repeatHeaderRows || 'none'}"
`;
}

module.exports = { buildPageSetupSnippet };
