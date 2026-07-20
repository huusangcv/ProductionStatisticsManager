import { Box } from "@mui/material";
import { GridFooter } from "@mui/x-data-grid";
import SummaryFooter from "./SummaryFooter";
import EmployeeSummaryFooter from "./EmployeeSummaryFooter";

function ProductionGridFooter({ summaryMode, ...props }) {
  return (
    <Box sx={{ width: "100%" }}>
      <SummaryFooter summaryMode={summaryMode} />
      {summaryMode && <EmployeeSummaryFooter summaryMode={summaryMode} />}
      <GridFooter {...props} />
    </Box>
  );
}

export default ProductionGridFooter;
