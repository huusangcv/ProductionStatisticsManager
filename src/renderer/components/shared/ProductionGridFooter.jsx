import { Box } from "@mui/material";
import { GridFooter } from "@mui/x-data-grid";
import SummaryFooter from "./SummaryFooter";

function ProductionGridFooter({ summaryMode, ...props }) {
  return (
    <Box sx={{ width: "100%" }}>
      <SummaryFooter summaryMode={summaryMode} />
      <GridFooter {...props} />
    </Box>
  );
}

export default ProductionGridFooter;
