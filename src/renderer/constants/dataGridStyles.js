export const sharedDataGridSx = {
  border: "none",
  width: "100%",
  minWidth: 0,
  color: "#0F172A",
  "& .MuiDataGrid-columnHeaders": {
    bgcolor: "#F8FAFC",
    color: "#64748B",
    fontWeight: 600,
    fontSize: 13,
    borderBottom: "1px solid #E2E8F0",
    borderTop: "1px solid #E2E8F0",
  },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
  "& .MuiDataGrid-cell": { borderColor: "#E2E8F0" },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none !important",
  },
  "& .MuiDataGrid-row:hover": { bgcolor: "#F8FAFC" },
  "& .MuiDataGrid-row.Mui-selected": {
    bgcolor: "#E0F2FE !important",
    "&:hover": {
      bgcolor: "#BAE6FD !important",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    minHeight: "auto",
    flexDirection: "column",
    alignItems: "stretch",
    p: 0,
    borderTop: "1px solid #E2E8F0",
  },
  "& .MuiTablePagination-root": {
    padding: "4px 12px",
  },
  "& .MuiTablePagination-toolbar": {
    minHeight: "40px",
    padding: 0,
  },
};
