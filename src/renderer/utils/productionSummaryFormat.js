export const PRODUCTION_SUMMARY_FIELDS = {
  completedQuantity: "completed_quantity",
  scrapQuantity: "scrap_quantity",
  unitWeight: "unit_weight",
  completedWeight: "completed_weight",
  jointCount: "joint_count",
  totalPrice: "total_price",
};

export function parseProductionNumber(value) {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatProductionQuantity(value) {
  return Math.round(value).toLocaleString("vi-VN");
}

export function formatProductionWeight(value) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

export function formatProductionPrice(value) {
  return Math.round(value).toLocaleString("vi-VN");
}

export function computeProductionSummaryTotals(rows) {
  return rows.reduce(
    (totals, row) => {
      const qty = parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.completedQuantity] ?? row.quantity);
      const joints = parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.jointCount]);
      totals.completedQuantity += qty;
      totals.scrapQuantity += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.scrapQuantity]);
      totals.unitWeight += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.unitWeight]);
      totals.completedWeight += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.completedWeight]);
      totals.jointCount += joints;
      totals.totalPrice += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.totalPrice]);

      const isCutting = row.source_type === "cutting" || row.sheet_name === "CẮT";
      const isGrinding = row.source_type === "grinding" || row.sheet_name === "MÀI";
      if (isCutting) {
        totals.cuttingQuantity += qty;
        totals.cuttingJointCount += joints;
      } else if (isGrinding) {
        totals.grindingQuantity += qty;
      }
      return totals;
    },
    {
      completedQuantity: 0,
      scrapQuantity: 0,
      unitWeight: 0,
      completedWeight: 0,
      jointCount: 0,
      totalPrice: 0,
      cuttingQuantity: 0,
      grindingQuantity: 0,
      cuttingJointCount: 0,
    },
  );
}
