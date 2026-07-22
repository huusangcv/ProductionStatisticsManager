// src/components/preview/PreviewPanel.jsx
import React, { memo, useState, useCallback, useRef, useMemo } from 'react';
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
 * Ví dụ: 25 nhân viên → [[19 NV], [6 NV]]
 * Thay đổi MAX_ROWS trong constants.js là đủ để điều chỉnh toàn hệ thống.
 */
function splitIntoPages(employees, rowsPerPage) {
  if (!employees || employees.length === 0) return [[]];
  const pages = [];
  for (let i = 0; i < employees.length; i += rowsPerPage) {
    pages.push(employees.slice(i, i + rowsPerPage));
  }
  return pages;
}

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
  otTimes, setEmployeeTime,
  notes, setNote,
  onZoomChange,
}) {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);

  // ─── Phân trang ──────────────────────────────────────────────
  // Tính toán lại chỉ khi danh sách nhân viên thay đổi.
  // Kết quả: mảng của mảng — mỗi phần tử là danh sách NV của 1 trang.
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
      // "Fit page" căn theo chiều cao 1 trang A4
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
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 2.5 }} className="no-print">
        <PreviewToolbar
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onZoomFitWidth={handleZoomFitWidth}
          onZoomFitPage={handleZoomFitPage}
          onRotate={handleRotate}
          onFullscreen={handleFullscreen}
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
        {/*
          print-area: container bao toàn bộ các trang.
          Trong preview: flex column, căn giữa.
          Khi in: position absolute để thoát khỏi flex layout,
                  mỗi .print-page ngắt sang trang mới.
        */}
        <Box
          className="print-area"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {pages.map((pageEmployees, pageIndex) => (
            <Box
              key={pageIndex}
              className="print-page"
            >
              {/* Nhãn số trang — chỉ hiển thị trên web, ẩn khi in */}
              <Box
                className="no-print"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 1.5,
                  // Khoảng cách giữa các trang (trừ trang đầu tiên)
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
                className="print-scale-wrapper" để CSS print có thể reset về static.
              */}
              <Box
                className="print-scale-wrapper"
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
                    // Khi in: reset tất cả transform và sizing về trạng thái tự nhiên
                    '@media print': {
                      transform:    'none !important',
                      width:        '100% !important',
                      height:       'auto !important',
                      position:     'static !important',
                      boxShadow:    'none !important',
                      borderRadius: '0 !important',
                    },
                  }}
                >
                  {/*
                    DocumentSheet nhận đúng danh sách NV của trang này.
                    Template không thay đổi, chỉ dữ liệu truyền vào khác nhau.
                  */}
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
  );
});

export default PreviewPanel;
