import attendanceRepository from "../repositories/attendanceRepository";

const attendanceService = {
  /**
   * Fetch attendance for a date.
   */
  async getAttendance(date) {
    const res = await attendanceRepository.getByDate(date);
    if (!res.ok) {
      throw new Error("Không thể tải dữ liệu điểm danh");
    }
    return res.records;
  },

  /**
   * Save a batch of attendance records.
   */
  async saveAttendance(date, records) {
    const res = await attendanceRepository.upsertBatch(date, records);
    if (!res.ok) {
      throw new Error("Lỗi khi lưu dữ liệu điểm danh");
    }
    return true;
  },

  /**
   * Check how many employees are missing attendance for a date.
   */
  async checkMissing(date) {
    const res = await attendanceRepository.checkMissing(date);
    if (!res.ok) {
      throw new Error("Không thể kiểm tra trạng thái điểm danh");
    }
    return res.missingCount;
  },

  /**
   * Compute stats for the dashboard.
   */
  computeStats(records) {
    const stats = {
      PRESENT: 0,
      LEAVE: 0,
      SICK: 0,
      ABSENT: 0,
      NOT_CHECKED: 0,
    };
    records.forEach(r => {
      if (stats[r.status] !== undefined) {
        stats[r.status]++;
      } else {
        stats.NOT_CHECKED++;
      }
    });
    return stats;
  }
};

export default attendanceService;
