// src/components/preview/PreviewPanel.jsx
import React, { memo, useState, useCallback, useRef, useMemo, useEffect, createRef } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import PreviewToolbar from './PreviewToolbar';
import DocumentSheet from './DocumentSheet';
import { MAX_ROWS } from '../../constants';

const ZOOM_STEP = 10;
const ZOOM_MIN  = 20;
const ZOOM_MAX  = 400;
const ZOOM_DEFAULT = 100;

// Kích thước A4 chuẩn ở 96 DPI
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/**
 * Chia mảng nhân viên thành các trang, mỗi trang tối đa MAX_ROWS phần tử.
 */
function splitIntoPages(employees, rowsPerPage) {
  if (!employees || employees.length === 0) return [[]];
  const pages = [];
  for (let i = 0; i < employees.length; i += rowsPerPage) {
    pages.push(employees.slice(i, i + rowsPerPage));
  }
  return pages;
}

// ─── Hidden Print Portal ──────────────────────────────────────────────────────
//
// Root cause of Electron print bug:
//   The preview renders DocumentSheet inside layered MUI Boxes:
//     position:absolute → transform:scale(zoom) → overflow:hidden
//   When @media print fires, Chromium/Electron resets transforms but the
//   containing-block / stacking-context chain is already corrupted.
//   Result: columns collapse, rows squish, layout breaks.
//
// Fix:
//   Render a SEPARATE hidden #overtime-print-portal div directly under <body>,
//   completely outside the React app tree. It contains clean flat 794×1123 px
//   page divs — no transforms, no flex, no overflow, no MUI Boxes.
//   @media print: hide body > * except the portal, show portal.
//   Electron prints a clean, unmangled DOM. Layout is always correct.
//
const PrintPortal = memo(function PrintPortal({
  pages, isSun, dateStr, deptName, otTimes, setEmployeeTime, notes, setNote,
}) {
  const [mountNode, setMountNode] = useState(null);

  useEffect(() => {
    // Create a standalone div directly under <body> — escapes ALL containing blocks
    const el = document.createElement('div');
    el.id = 'overtime-print-portal';
    // Hidden on screen; revealed only by @media print rule
    el.style.cssText = 'display:none;';
    document.body.appendChild(el);
    setMountNode(el);

    return () => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    };
  }, []);

  if (!mountNode) return null;

  const portalContent = (
    <div style={{ display: 'block', width: '794px', margin: 0, padding: 0 }}>
      {pages.map((pageEmployees, pageIndex) => (
        <div
          key={pageIndex}
          style={{
            display: 'block',
            width: '794px',
            height: '1123px',
            overflow: 'hidden',
            pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'avoid',
            breakAfter: pageIndex < pages.length - 1 ? 'page' : 'avoid',
            margin: 0,
            padding: 0,
          }}
        >
          <DocumentSheet
            selArr={pageEmployees}
            isSun={isSun}
            dateStr={dateStr}
            deptName={deptName}
            otTimes={otTimes}
            setEmployeeTime={setEmployeeTime}
            startIndex={pageIndex * MAX_ROWS}
            notes={notes}
            setNote={setNote}
          />
        </div>
      ))}
    </div>
  );

  return createPortal(portalContent, mountNode);
});

// ─── PreviewPanel ─────────────────────────────────────────────────────────────
/**
 * PreviewPanel – canvas hiển thị tất cả các trang dạng cuộn liên tục (như PDF viewer).
 * Props:
 *   selArr          : Employee[]
 *   isSun           : boolean
 *   dateStr         : string
 *   deptName        : string
 *   otTimes         : object
 *   setEmployeeTime : (id, time) => void
 *   onZoomChange    : (zoom: number) => void
 */
const PreviewPanel = memo(function PreviewPanel({
  selArr, isSun, dateStr, deptName,
  onPrint,
  otTimes, setEmployeeTime,
  notes, setNote,
  onZoomChange,
}) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);

  // ─── Phân trang ──────────────────────────────────────────────
  const pages = useMemo(
    () => splitIntoPages(selArr, MAX_ROWS),
    [selArr]
  );
  const totalPages = pages.length;

  // ─── Zoom handlers ────────────────────────────────────────────
  const setZoomAndReport = useCallback((newZoom) => {
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [onZoomChange]);

  const handleZoomIn    = useCallback(() => setZoomAndReport(z => Math.min(z + ZOOM_STEP, ZOOM_MAX)), [setZoomAndReport]);
  const handleZoomOut   = useCallback(() => setZoomAndReport(z => Math.max(z - ZOOM_STEP, ZOOM_MIN)), [setZoomAndReport]);
  const handleZoomReset = useCallback(() => setZoomAndReport(ZOOM_DEFAULT), [setZoomAndReport]);

  const handleZoomFitWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const padding = 64;
      const scale = (containerWidth - padding) / A4_WIDTH;
      setZoomAndReport(Math.max(ZOOM_MIN, Math.min(Math.round(scale * 100), ZOOM_MAX)));
    }
  }, [setZoomAndReport]);

  const handleZoomFitPage = useCallback(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      const padding = 64;
      const scale = (containerHeight - padding) / A4_HEIGHT;
      setZoomAndReport(Math.max(ZOOM_MIN, Math.min(Math.round(scale * 100), ZOOM_MAX)));
    }
  }, [setZoomAndReport]);

  const handleRotate = useCallback(() => {
    setRotation(r => (r + 90) % 360);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  // ─── Sizing ───────────────────────────────────────────────────
  const isRotated = rotation % 180 !== 0;
  const currentWidth  = isRotated ? A4_HEIGHT : A4_WIDTH;
  const currentHeight = isRotated ? A4_WIDTH  : A4_HEIGHT;

  const scaledWidth  = currentWidth  * (zoom / 100);
  const scaledHeight = currentHeight * (zoom / 100);

  return (
    <>
      {/*
        PrintPortal mounts directly under <body>, completely outside the app tree.
        @media print shows ONLY #overtime-print-portal and hides everything else.
        This is the fix for Electron's stacking-context / transform print bug.
      */}
      <PrintPortal
        pages={pages}
        isSun={isSun}
        dateStr={dateStr}
        deptName={deptName}
        otTimes={otTimes}
        setEmployeeTime={setEmployeeTime}
        notes={notes}
        setNote={setNote}
      />

      {/* ── Screen UI (hidden during print via CSS) ────────────── */}
      <Box
        ref={containerRef}
        className="no-print"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'background.default',
        }}
      >
        {/* ── Toolbar ────────────────────────────────────────────── */}
        <Box sx={{ px: 3, pt: 2.5 }}>
          <PreviewToolbar
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onZoomFitWidth={handleZoomFitWidth}
            onZoomFitPage={handleZoomFitPage}
            onRotate={handleRotate}
            onFullscreen={handleFullscreen}
            onPrint={onPrint}
          />
        </Box>

        {/* ── Canvas — cuộn liên tục như PDF viewer ─────────────── */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 4,
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Nền chấm bi — texture kiểu PDF viewer
            backgroundImage: 'radial-gradient(circle, #C9CDD3 0.75px, transparent 0.75px)',
            backgroundSize: '20px 20px',
            backgroundColor: '#E8EAED',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {pages.map((pageEmployees, pageIndex) => (
              <Box key={pageIndex}>
                {/* Nhãn số trang — chỉ hiển thị trên web, ẩn khi in */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 1.5,
                    mt: pageIndex === 0 ? 0 : 4,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.48)',
                      color: '#fff',
                      px: 2.5,
                      py: 0.5,
                      borderRadius: 10,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      fontFamily: '"Inter", sans-serif',
                      userSelect: 'none',
                    }}
                  >
                    Trang {pageIndex + 1} / {totalPages}
                  </Box>
                </Box>

                {/*
                  Scale Wrapper — duy trì kích thước thực để scrollbar hoạt động đúng.
                */}
                <Box
                  sx={{
                    width: scaledWidth,
                    height: scaledHeight,
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'width 200ms ease, height 200ms ease',
                  }}
                >
                  {/* Tờ A4 — phần tử được scale + rotate */}
                  <Box
                    sx={{
                      width: A4_WIDTH,
                      height: A4_HEIGHT,
                      position: 'absolute',
                      top:  isRotated ? (A4_WIDTH  - A4_HEIGHT) / 2 : 0,
                      left: isRotated ? (A4_HEIGHT - A4_WIDTH)  / 2 : 0,
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: isRotated ? 'center center' : 'top left',
                      backgroundColor: '#fff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <DocumentSheet
                      selArr={pageEmployees}
                      isSun={isSun}
                      dateStr={dateStr}
                      deptName={deptName}
                      otTimes={otTimes}
                      setEmployeeTime={setEmployeeTime}
                      startIndex={pageIndex * MAX_ROWS}
                      notes={notes}
                      setNote={setNote}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
});

export default PreviewPanel;
