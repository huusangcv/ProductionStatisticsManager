import { useState, useCallback, useEffect } from "react";
import templateService from "../services/templateService";
import { templateTypeRepository } from "../repositories/templateTypeRepository";
import { usePrinters } from "./usePrinters";

// Pure column validation helper (mirrors printAreaBuilder logic in the frontend)
function _columnToIndex(letter) {
  if (!letter) return 0;
  const upper = String(letter).toUpperCase().trim();
  if (!/^[A-Z]{1,3}$/.test(upper)) return 0;
  let idx = 0;
  for (let i = 0; i < upper.length; i++) idx = idx * 26 + (upper.charCodeAt(i) - 64);
  return idx;
}
function _validateColumns(start, end) {
  const si = _columnToIndex(start);
  const ei = _columnToIndex(end);
  if (!si) return { valid: false, message: `Cột bắt đầu không hợp lệ: "${start}"` };
  if (!ei) return { valid: false, message: `Cột kết thúc không hợp lệ: "${end}"` };
  if (si > ei) return { valid: false, message: `Cột bắt đầu (${start}) phải nhỏ hơn hoặc bằng cột kết thúc (${end})` };
  return { valid: true };
}

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [templateTypes, setTemplateTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const { defaultPrinter, printExcel: printWithPrinterService } = usePrinters();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesResult, typesData] = await Promise.all([
        templateService.getAll(),
        templateTypeRepository.getAll()
      ]);
      setTemplates(templatesResult?.success ? (templatesResult.data || []) : []);
      setTemplateTypes(typesData || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setTemplates([]);
      setTemplateTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleUploadSubmit = useCallback(
    async ({ module, sourcePath, sheetName, startColumn, endColumn }) => {
      setLoading(true);
      try {
        const existing = templates.find((t) => t.module === module);
        if (existing) {
          return new Promise((resolve) => {
            setConfirmDialog({
              open: true,
              title: "Xác nhận ghi đè",
              message: `Template ${existing.template_name} đã tồn tại. Bạn có muốn ghi đè không?`,
              onConfirm: async () => {
                setConfirmDialog({ open: false });
                const result = await templateService.upload({
                  module,
                  sourcePath,
                  overwrite: true,
                  sheetName,
                  startColumn,
                  endColumn
                });
                if (result.success) {
                  await fetchTemplates();
                  resolve({ success: true, message: "Upload template thành công" });
                } else {
                  resolve({ success: false, message: result.message || "Upload thất bại" });
                }
              },
            });
          });
        }

        const result = await templateService.upload({
          module,
          sourcePath,
          overwrite: false,
          sheetName,
          startColumn,
          endColumn
        });

        if (result.success) {
          await fetchTemplates();
          return { success: true, message: "Upload template thành công" };
        } else {
          return { success: false, message: result.message || "Upload thất bại" };
        }
      } catch (error) {
        console.error("Failed to upload template:", error);
        return { success: false, message: error.message || "Lỗi không xác định" };
      } finally {
        setLoading(false);
      }
    },
    [templates, fetchTemplates],
  );

  const handleReplace = useCallback(async () => {
    if (!selectedTemplate)
      return { success: false, message: "Chưa chọn template" };

    setLoading(true);
    try {
      const selectResult = await templateService.selectFile();
      if (!selectResult.success || selectResult.canceled) {
        return { success: false, canceled: true };
      }

      const result = await templateService.replace({
        module: selectedTemplate.module,
        sourcePath: selectResult.filePath,
      });

      if (result.success) {
        await fetchTemplates();
        return { success: true, message: "Đã thay thế template" };
      } else {
        return {
          success: false,
          message: result.message || "Thay thế thất bại",
        };
      }
    } catch (error) {
      console.error("Failed to replace template:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate, fetchTemplates]);

  const handlePreview = useCallback(async () => {
    if (!selectedTemplate)
      return { success: false, message: "Chưa chọn template" };

    try {
      const result = await templateService.preview(
        selectedTemplate.template_path,
      );
      if (result.success) {
        return { success: true, message: "Đã mở file" };
      } else {
        return {
          success: false,
          message: result.message || "Không thể mở file",
        };
      }
    } catch (error) {
      console.error("Failed to preview template:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    }
  }, [selectedTemplate]);

  const handleOpenFolder = useCallback(async () => {
    try {
      const result = await templateService.openFolder();
      if (result.success) {
        return { success: true, message: "Đã mở thư mục" };
      } else {
        return {
          success: false,
          message: result.message || "Không thể mở thư mục",
        };
      }
    } catch (error) {
      console.error("Failed to open folder:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    }
  }, []);

  const handlePrintTest = useCallback(async () => {
    if (!selectedTemplate)
      return { success: false, message: "Chưa chọn template" };

    if (!defaultPrinter?.printer_name) {
      return { success: false, message: "Chưa cấu hình máy in" };
    }

    try {
      const result = await printWithPrinterService(
        selectedTemplate.template_path,
      );
      if (result.success || result.ok) {
        return { success: true, message: "Print Test thành công" };
      } else {
        return {
          success: false,
          message: result.message || "Print Test thất bại",
        };
      }
    } catch (error) {
      console.error("Failed to print test:", error);
      return { success: false, message: error.message || "Lỗi không xác định" };
    }
  }, [selectedTemplate, defaultPrinter, printWithPrinterService]);

  const handleDelete = useCallback(async () => {
    if (!selectedTemplate)
      return { success: false, message: "Chưa chọn template" };

    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title: "Xác nhận xóa",
        message: `Bạn có chắc chắn muốn xóa template ${selectedTemplate.template_name}?`,
        onConfirm: async () => {
          setConfirmDialog({ open: false });
          setLoading(true);
          try {
            const result = await templateService.delete(
              selectedTemplate.module,
            );
            if (result.success) {
              await fetchTemplates();
              handleCloseDrawer();
              setSelectedTemplate(null);
              resolve({ success: true, message: "Đã xóa template" });
            } else {
              resolve({
                success: false,
                message: result.message || "Xóa thất bại",
              });
            }
          } catch (error) {
            console.error("Failed to delete template:", error);
            resolve({
              success: false,
              message: error.message || "Lỗi không xác định",
            });
          } finally {
            setLoading(false);
          }
        },
      });
    });
  }, [selectedTemplate, fetchTemplates, handleCloseDrawer]);

  const handleRefresh = useCallback(async () => {
    await fetchTemplates();
    return { success: true, message: "Đã làm mới" };
  }, [fetchTemplates]);

  const handleSavePrintConfig = useCallback(
    async (config) => {
      if (!selectedTemplate) return { success: false, message: "Chưa chọn template" };

      const validation = _validateColumns(config.startColumn, config.endColumn);
      if (!validation.valid) return { success: false, message: validation.message };

      setLoading(true);
      try {
        const result = await templateService.updatePrintConfig({
          module: selectedTemplate.module,
          ...config,
        });
        if (result.ok) {
          // Refresh list and update the selected template in-place
          await fetchTemplates();
          setSelectedTemplate((prev) =>
            prev ? { ...prev, ...config, print_start_column: config.startColumn, print_end_column: config.endColumn } : prev
          );
          return { success: true, message: `Đã lưu cấu hình in` };
        } else {
          return { success: false, message: result.message || "Lưu thất bại" };
        }
      } catch (error) {
        console.error("Failed to save print config:", error);
        return { success: false, message: error.message || "Lỗi không xác định" };
      } finally {
        setLoading(false);
      }
    },
    [selectedTemplate, fetchTemplates],
  );

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog({ open: false, title: "", message: "", onConfirm: null });
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    templateTypes,
    loading,
    selectedTemplate,
    drawerOpen,
    confirmDialog,
    fetchTemplates,
    handleSelectTemplate,
    handleCloseDrawer,
    handleUploadSubmit,
    handleReplace,
    handlePreview,
    handleOpenFolder,
    handlePrintTest,
    handleDelete,
    handleRefresh,
    handleSavePrintConfig,
    handleConfirmDialogClose,
  };
}
