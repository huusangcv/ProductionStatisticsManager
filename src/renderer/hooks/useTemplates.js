import { useState, useCallback, useEffect } from "react";
import templateService from "../services/templateService";
import { usePrinters } from "./usePrinters";

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
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
      const result = await templateService.getAll();
      if (result.success) {
        setTemplates(result.data || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
      setTemplates([]);
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

  const handleUpload = useCallback(
    async (module) => {
      setLoading(true);
      try {
        const selectResult = await templateService.selectFile();
        if (!selectResult.success || selectResult.canceled) {
          return { success: false, canceled: true };
        }

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
                  sourcePath: selectResult.filePath,
                  overwrite: true,
                });
                if (result.success) {
                  await fetchTemplates();
                  resolve({
                    success: true,
                    message: "Upload template thành công",
                  });
                } else {
                  resolve({
                    success: false,
                    message: result.message || "Upload thất bại",
                  });
                }
              },
            });
          });
        }

        const result = await templateService.upload({
          module,
          sourcePath: selectResult.filePath,
          overwrite: false,
        });

        if (result.success) {
          await fetchTemplates();
          return { success: true, message: "Upload template thành công" };
        } else {
          return {
            success: false,
            message: result.message || "Upload thất bại",
          };
        }
      } catch (error) {
        console.error("Failed to upload template:", error);
        return {
          success: false,
          message: error.message || "Lỗi không xác định",
        };
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

  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialog({ open: false, title: "", message: "", onConfirm: null });
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    selectedTemplate,
    drawerOpen,
    confirmDialog,
    fetchTemplates,
    handleSelectTemplate,
    handleCloseDrawer,
    handleUpload,
    handleReplace,
    handlePreview,
    handleOpenFolder,
    handlePrintTest,
    handleDelete,
    handleRefresh,
    handleConfirmDialogClose,
  };
}
