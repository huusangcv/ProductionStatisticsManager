const attendanceRepository = {
  getByDate: async (date) => {
    return window.electronAPI.attendance.getByDate(date);
  },

  upsertBatch: async (date, records) => {
    return window.electronAPI.attendance.upsertBatch(date, records);
  },

  checkMissing: async (date) => {
    return window.electronAPI.attendance.checkMissing(date);
  },
};

export default attendanceRepository;
