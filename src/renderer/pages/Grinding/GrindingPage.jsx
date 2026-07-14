import ProductionPage from "../../components/shared/ProductionPage";
import { getGrindingDataGridColumns } from "../../../constants/grindingColumns";

export default function GrindingPage() {
  return (
    <ProductionPage
      moduleName="Sản lượng Mài"
      ipcKey="grinding"
      columnSpec={getGrindingDataGridColumns()}
    />
  );
}
