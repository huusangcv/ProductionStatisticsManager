const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { shell, dialog, BrowserWindow } = require("electron");
const templateDAO = require("../sqlite/excelTemplates");
const { getAppDataRoot } = require("../sqlite/paths");

function calculateChecksum(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash("md5");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  } catch (error) {
    return null;
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return null;
  }
}

function getTemplatesDir() {
  return path.join(getAppDataRoot(), "templates");
}

const templateService = {
  getAllTemplates: () => {
    try {
      const templates = templateDAO.getAllTemplates() || [];
      return templates.map(template => {
        let status = template.status;
        if (template.template_path && fs.existsSync(template.template_path)) {
          const checksum = calculateChecksum(template.template_path);
          const fileSize = getFileSize(template.template_path);
          if (checksum !== template.checksum || fileSize !== template.file_size) {
            templateDAO.upsertTemplate({ ...template, checksum, file_size: fileSize });
          }
          status = "active";
        } else {
          status = "missing";
        }
        return { ...template, status };
      });
    } catch (error) {
      console.error("Error in getAllTemplates:", error);
      return [];
    }
  },

  getTemplate: (module) => templateDAO.getTemplate(module),

  upsertTemplate: (data) => {
    const checksum = calculateChecksum(data.template_path);
    const fileSize = getFileSize(data.template_path);
    return templateDAO.upsertTemplate({ ...data, checksum, file_size: fileSize });
  },

  deleteTemplate: (module) => {
    try {
      const template = templateDAO.getTemplate(module);
      if (template && template.template_path && fs.existsSync(template.template_path)) {
        fs.unlinkSync(template.template_path);
      }
      templateDAO.deleteTemplate(module);
      return { success: true };
    } catch (error) {
      console.error("Error deleting template:", error);
      return { success: false, message: error.message || "Lỗi xóa template" };
    }
  },

  calculateChecksum,
  getFileSize,

  selectFile: async (event, defaultPath) => {
    try {
      console.log("templateService.selectFile: called", { defaultPath });
      let win = null;
      if (event && event.sender) {
        win = BrowserWindow.fromWebContents(event.sender);
      }
      console.log("templateService.selectFile: win", win);
      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: "Chọn file Excel",
        filters: [
          { name: "Excel Files", extensions: ["xlsx", "xls", "xlsm"] },
        ],
        properties: ["openFile"],
        defaultPath
      });
      
      console.log("templateService.selectFile: dialog result", { canceled, filePaths });
      if (canceled || !filePaths.length) {
        return { success: false, canceled: true };
      }
      
      return { success: true, filePath: filePaths[0] };
    } catch (error) {
      console.error("Error selecting file:", error);
      return { success: false, message: error.message || "Lỗi chọn file" };
    }
  },

  copyTemplate: async (sourcePath, module, overwrite = false) => {
    try {
      const templatesDir = getTemplatesDir();
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      const originalName = path.basename(sourcePath);
      const destFileName = `${module}${path.extname(sourcePath)}`;
      const destPath = path.join(templatesDir, destFileName);

      if (fs.existsSync(destPath) && !overwrite) {
        return { success: false, message: "File đã tồn tại", exists: true };
      }

      // Backup existing file if needed
      if (fs.existsSync(destPath)) {
        const backupPath = `${destPath}.backup.${Date.now()}`;
        fs.copyFileSync(destPath, backupPath);
      }

      fs.copyFileSync(sourcePath, destPath);

      const checksum = calculateChecksum(destPath);
      const fileSize = getFileSize(destPath);

      // Upsert to DB
      const result = templateDAO.upsertTemplate({
        module,
        template_name: originalName,
        template_path: destPath,
        sheet_name: "Sheet1",
        start_row: 3,
        checksum,
        file_size: fileSize,
        status: "active"
      });

      if (!result.ok) {
        return { success: false, message: "Lỗi lưu CSDL" };
      }

      return { success: true, filePath: destPath };
    } catch (error) {
      console.error("Error copying template:", error);
      return { success: false, message: error.message || "Lỗi lưu file" };
    }
  },

  openFolder: () => {
    try {
      const templatesDir = getTemplatesDir();
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }
      shell.openPath(templatesDir);
      return { success: true };
    } catch (error) {
      console.error("Error opening folder:", error);
      return { success: false, message: error.message || "Lỗi mở thư mục" };
    }
  },

  openFile: (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, message: "Không tìm thấy file" };
      }
      shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error("Error opening file:", error);
      return { success: false, message: error.message || "Lỗi mở file" };
    }
  },
};

module.exports = templateService;
