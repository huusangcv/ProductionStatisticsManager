export const viVNGridLocaleText = {
  // Toolbar
  toolbarColumns: "Cột",
  toolbarColumnsLabel: "Chọn cột hiển thị",
  toolbarFilters: "Bộ lọc",
  toolbarFiltersLabel: "Hiển thị bộ lọc",
  toolbarFiltersTooltipHide: "Ẩn bộ lọc",
  toolbarFiltersTooltipShow: "Hiển thị bộ lọc",
  toolbarDensity: "Mật độ",
  toolbarDensityLabel: "Mật độ",
  toolbarDensityCompact: "Gọn",
  toolbarDensityStandard: "Tiêu chuẩn",
  toolbarDensityComfortable: "Thoải mái",
  toolbarExport: "Xuất file",
  toolbarExportLabel: "Xuất file",
  toolbarExportCSV: "Tải xuống CSV",
  toolbarExportPrint: "In",
  toolbarExportExcel: "Tải xuống Excel",

  // Cột (Columns panel)
  columnsPanelTextFieldLabel: "Tìm cột",
  columnsPanelTextFieldPlaceholder: "Tên cột",
  columnsPanelDragIconLabel: "Sắp xếp lại cột",
  columnsPanelShowAllButton: "Hiện tất cả",
  columnsPanelHideAllButton: "Ẩn tất cả",

  // Bộ lọc (Filter panel)
  filterPanelAddFilter: "Thêm bộ lọc",
  filterPanelRemoveAll: "Xóa tất cả",
  filterPanelDeleteIconLabel: "Xóa",
  filterPanelLogicOperator: "Toán tử logic",
  filterPanelOperator: "Toán tử",
  filterPanelOperatorAnd: "Và",
  filterPanelOperatorOr: "Hoặc",
  filterPanelColumns: "Cột",
  filterPanelInputLabel: "Giá trị",
  filterPanelInputPlaceholder: "Nhập giá trị lọc",

  // Toán tử lọc
  filterOperatorContains: "chứa",
  filterOperatorEquals: "bằng",
  filterOperatorStartsWith: "bắt đầu với",
  filterOperatorEndsWith: "kết thúc với",
  filterOperatorIs: "là",
  filterOperatorNot: "không là",
  filterOperatorAfter: "sau",
  filterOperatorOnOrAfter: "vào hoặc sau",
  filterOperatorBefore: "trước",
  filterOperatorOnOrBefore: "vào hoặc trước",
  filterOperatorIsEmpty: "rỗng",
  filterOperatorIsNotEmpty: "không rỗng",
  filterOperatorIsAnyOf: "thuộc nhóm",

  // Menu cột (header menu)
  columnMenuLabel: "Menu",
  columnMenuShowColumns: "Hiện các cột",
  columnMenuManageColumns: "Quản lý cột",
  columnMenuFilter: "Lọc",
  columnMenuHideColumn: "Ẩn cột",
  columnMenuUnsort: "Bỏ sắp xếp",
  columnMenuSortAsc: "Sắp xếp tăng dần",
  columnMenuSortDesc: "Sắp xếp giảm dần",

  // Phân trang / Footer
  footerRowSelected: (count) =>
    count !== 1 ? `Đã chọn ${count.toLocaleString()} dòng` : `Đã chọn 1 dòng`,
  footerTotalRows: "Tổng số dòng:",
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`,
  MuiTablePagination: {
    labelRowsPerPage: "Số dòng mỗi trang:",
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} trong ${count !== -1 ? count : `nhiều hơn ${to}`}`,
  },

  // Khi không có dữ liệu
  noRowsLabel: "Không có dữ liệu",
  noResultsOverlayLabel: "Không tìm thấy kết quả",

  // Checkbox chọn dòng
  checkboxSelectionHeaderName: "Chọn dòng",
  checkboxSelectionSelectAllRows: "Chọn tất cả các dòng",
  checkboxSelectionUnselectAllRows: "Bỏ chọn tất cả các dòng",
  checkboxSelectionSelectRow: "Chọn dòng",
  checkboxSelectionUnselectRow: "Bỏ chọn dòng",
};
