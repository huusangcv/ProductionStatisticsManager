import ProductionPage from "../../components/shared/ProductionPage";
import { getCuttingDataGridColumns } from "../../../constants/cuttingColumns";

export default function CuttingPage() {
  return (
    <ProductionPage
      moduleName="Sản lượng Cắt"
      ipcKey="cutting"
      columnSpec={getCuttingDataGridColumns()}
    />
  );
}
