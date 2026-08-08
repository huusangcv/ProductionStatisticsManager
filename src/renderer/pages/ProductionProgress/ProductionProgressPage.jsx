import React, { useState, useEffect, useMemo, useRef } from "react";
import { Box, Card, Typography, Select, MenuItem, CircularProgress } from "@mui/material";
import ExcelJS from "exceljs";
import ProgressDataGrid from "./components/ProgressDataGrid";

export default function ProductionProgressPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const fileInputRef = useRef(null);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.furnace.getProgress();
      setRecords(data || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi tải tiến độ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  // Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Status
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, statusFilter]);

  // Handle Excel Import (Drag & Drop or click)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await window.electronAPI.furnace.import(file.path);
      if (res.success) {
        alert(`Nhập thành công ${res.count} dòng dữ liệu Lò!`);
        loadProgress();
      } else {
        alert("Lỗi nhập dữ liệu: " + res.message);
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = null; // Reset input
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert("Vui lòng chọn file Excel hợp lệ!");
      return;
    }

    setImporting(true);
    try {
      const res = await window.electronAPI.furnace.import(file.path);
      if (res.success) {
        alert(`Nhập thành công ${res.count} dòng dữ liệu Lò!`);
        loadProgress();
      } else {
        alert("Lỗi nhập dữ liệu: " + res.message);
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Handle Export Excel "TÌM HÀNG"
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Tiến độ Sản xuất");

      // 18. SẮP XẾP DỮ LIỆU
      const getStatusPriority = (status) => {
        if (status === "Quá hạn Cắt") return 1;
        if (status === "Quá hạn Mài") return 2;
        return 3;
      };

      const dataToExport = [...filteredRecords].sort((a, b) => {
        const pA = getStatusPriority(a.status);
        const pB = getStatusPriority(b.status);
        if (pA !== pB) return pA - pB;
        
        // Số ngày tồn (days_since_furnace) giảm dần
        const daysA = Number(a.days_since_furnace) || 0;
        const daysB = Number(b.days_since_furnace) || 0;
        if (daysA !== daysB) return daysB - daysA;
        
        // Thiếu số lượng giảm dần
        const missingA = (Number(a.missing_cutting) || 0) + (Number(a.missing_grinding) || 0);
        const missingB = (Number(b.missing_cutting) || 0) + (Number(b.missing_grinding) || 0);
        return missingB - missingA;
      });

      // 4. HEADER
      const titleRow = sheet.addRow(["TÌM HÀNG – TIẾN ĐỘ SẢN XUẤT"]);
      titleRow.font = { name: "Arial", size: 16, bold: true };
      sheet.mergeCells('A1:O1');
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const dateStr = new Date().toLocaleDateString("vi-VN");
      const dateRow = sheet.addRow([`Ngày báo cáo: ${dateStr}`]);
      dateRow.font = { name: "Arial", size: 11, italic: true };
      sheet.mergeCells('A2:O2');
      dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      const descRow = sheet.addRow(["Danh sách công đơn chưa hoàn thành / quá hạn"]);
      descRow.font = { name: "Arial", size: 11 };
      sheet.mergeCells('A3:O3');
      descRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      sheet.addRow([]); // Blank row

      // 5. BẢNG DỮ LIỆU
      const tableHeaderRowIdx = 5;
      const columnsDef = [
        { header: "STT", key: "stt", width: 6 },
        { header: "Ngày Lò", key: "furnace_date", width: 12 },
        { header: "Mã công đơn", key: "work_order_number", width: 18 },
        { header: "Tên hàng", key: "item_name", width: 30 },
        { header: "Mã liệu", key: "material_code", width: 15 },
        { header: "Quy cách", key: "specification", width: 18 },
        { header: "SL Lò", key: "furnace_qty", width: 12 },
        { header: "SL Cắt", key: "cutting_qty", width: 12 },
        { header: "Thiếu Cắt", key: "missing_cutting", width: 12 },
        { header: "SL Mài", key: "grinding_qty", width: 12 },
        { header: "Thiếu Mài", key: "missing_grinding", width: 12 },
        { header: "Số xâu", key: "pending_strings", width: 10 },
        { header: "Số ngày tồn", key: "days_since_furnace", width: 12 },
        { header: "Trạng thái", key: "status", width: 18 },
        { header: "Ghi chú", key: "note", width: 30 },
      ];
      
      sheet.columns = columnsDef;

      const headerRow = sheet.getRow(tableHeaderRowIdx);
      headerRow.values = columnsDef.map(c => c.header);
      headerRow.height = 35;

      // 7. FORMAT HEADER BẢNG
      headerRow.eachCell((cell) => {
        cell.font = { name: "Arial", bold: true, size: 10, color: { argb: "FF000000" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDEEAF6" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
      });

      // 15. AUTOFILTER
      sheet.autoFilter = `A${tableHeaderRowIdx}:O${tableHeaderRowIdx}`;

      // 14. FREEZE HEADER
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: tableHeaderRowIdx }];

      let sumFurnace = 0, sumCutting = 0, sumMissingCutting = 0;
      let sumGrinding = 0, sumMissingGrinding = 0, sumStrings = 0;

      dataToExport.forEach((r, idx) => {
        const rowValues = {
          stt: idx + 1,
          furnace_date: r.furnace_date,
          work_order_number: r.work_order_number,
          item_name: r.item_name,
          material_code: r.material_code,
          specification: r.specification,
          furnace_qty: Number(r.furnace_qty) || 0,
          cutting_qty: Number(r.cutting_qty) || 0,
          missing_cutting: Number(r.missing_cutting) || 0,
          grinding_qty: Number(r.grinding_qty) || 0,
          missing_grinding: Number(r.missing_grinding) || 0,
          pending_strings: (Number(r.pending_cutting_strings) || 0) + (Number(r.pending_grinding_strings) || 0),
          days_since_furnace: Number(r.days_since_furnace) || 0,
          status: r.status,
          note: "" // 6. CỘT GHI CHÚ
        };

        sumFurnace += rowValues.furnace_qty;
        sumCutting += rowValues.cutting_qty;
        sumMissingCutting += rowValues.missing_cutting;
        sumGrinding += rowValues.grinding_qty;
        sumMissingGrinding += rowValues.missing_grinding;
        sumStrings += rowValues.pending_strings;

        const row = sheet.addRow(rowValues);

        // 8. FORMAT CELL & 9. FORMAT SỐ
        row.eachCell((cell, colNumber) => {
          const colKey = columnsDef[colNumber - 1].key;
          cell.font = { name: "Arial", size: 10 };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
          };
          cell.alignment = { vertical: "middle" };

          if (["stt", "furnace_date", "work_order_number", "material_code", "days_since_furnace", "status"].includes(colKey)) {
            cell.alignment = { ...cell.alignment, horizontal: "center" };
          } else if (["item_name", "specification", "note"].includes(colKey)) {
            cell.alignment = { ...cell.alignment, horizontal: "left" };
          } else {
            cell.alignment = { ...cell.alignment, horizontal: "right" };
            cell.numFmt = Number.isInteger(cell.value) ? '#,##0' : '#,##0.00';
          }
          
          // 11. CỘT THIẾU NỔI BẬT
          if (["missing_cutting", "missing_grinding"].includes(colKey)) {
            if (cell.value > 0) {
              cell.font = { ...cell.font, bold: true, color: { argb: "FFC5221F" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE6E6" } };
            }
          }

          // 10. TRẠNG THÁI COLOR
          if (colKey === "status") {
            const status = cell.value || "";
            let bgColor = "FFFFFFFF";
            if (status.includes("Quá hạn")) bgColor = "FFFFD9D9"; // Đỏ nhạt
            else if (status.includes("Chờ") || status.includes("Đang") || status.includes("Chưa")) bgColor = "FFFFF2CC"; // Vàng nhạt
            else if (status === "Hoàn thành") bgColor = "FFE2EFDA"; // Xanh nhạt
            
            if (bgColor !== "FFFFFFFF") {
               cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
            }
          }
        });
      });

      // 19. TỔNG CUỐI BẢNG
      const totalRow = sheet.addRow({
        stt: "TỔNG",
        furnace_qty: sumFurnace,
        cutting_qty: sumCutting,
        missing_cutting: sumMissingCutting,
        grinding_qty: sumGrinding,
        missing_grinding: sumMissingGrinding,
        pending_strings: sumStrings
      });
      
      sheet.mergeCells(`A${totalRow.number}:F${totalRow.number}`);
      
      totalRow.eachCell((cell, colNumber) => {
        const colKey = columnsDef[colNumber - 1].key;
        cell.font = { name: "Arial", bold: true, size: 11 };
        cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };

        if (colNumber === 1) { 
           cell.alignment = { horizontal: "center", vertical: "middle" };
        } else if (["furnace_qty", "cutting_qty", "missing_cutting", "grinding_qty", "missing_grinding", "pending_strings"].includes(colKey)) {
           cell.alignment = { horizontal: "right", vertical: "middle" };
           cell.numFmt = Number.isInteger(cell.value) ? '#,##0' : '#,##0.00';
        }
      });

      // 16. PRINT SETUP
      sheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5, right: 0.5,
          top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        },
        horizontalCentered: true,
        printTitlesRow: `${tableHeaderRowIdx}:${tableHeaderRowIdx}`,
        printArea: `A1:O${totalRow.number}`
      };

      // 17. HEADER/FOOTER
      sheet.headerFooter = {
        oddHeader: '&C&"Arial,Bold"&14TÌM HÀNG – TIẾN ĐỘ SẢN XUẤT',
        oddFooter: '&RTrang &P / &N'
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tim_Hang_Tien_Do_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error", err);
      alert("Lỗi xuất Excel!");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Hidden file input for import */}
      <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
      
      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          p: "16px 20px",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <ProgressDataGrid 
          records={filteredRecords} 
          loading={loading || importing} 
          statusFilterSelect={
            <Select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: 160, bgcolor: "white",
                height: "36px !important",
                borderRadius: "8px",
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E2E8F0",
                }
              }}
            >
              <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
              <MenuItem value="Chưa Cắt">Chưa Cắt</MenuItem>
              <MenuItem value="Đang Cắt">Đang Cắt</MenuItem>
              <MenuItem value="Chờ Mài">Chờ Mài</MenuItem>
              <MenuItem value="Đang Mài">Đang Mài</MenuItem>
              <MenuItem value="Quá hạn Cắt">Quá hạn Cắt</MenuItem>
              <MenuItem value="Quá hạn Mài">Quá hạn Mài</MenuItem>
              <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
            </Select>
          }
          onImport={handleImportClick}
          onExport={handleExport}
          onRefresh={loadProgress}
        />
      </Card>
    </Box>
  );
}
