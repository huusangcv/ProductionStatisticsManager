import { Box } from "@mui/material";
import { GridFooter } from "@mui/x-data-grid";
import SummaryFooter from "./SummaryFooter";

function ProductionGridFooter() {
  return (
    <Box sx={{ width: "100%" }}>
      <GridFooter />
      <SummaryFooter />
    </Box>
  );
}

export default ProductionGridFooter;
