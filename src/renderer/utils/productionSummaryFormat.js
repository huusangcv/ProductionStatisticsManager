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
      totals.completedQuantity += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.completedQuantity]);
      totals.scrapQuantity += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.scrapQuantity]);
      totals.unitWeight += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.unitWeight]);
      totals.completedWeight += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.completedWeight]);
      totals.jointCount += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.jointCount]);
      totals.totalPrice += parseProductionNumber(row[PRODUCTION_SUMMARY_FIELDS.totalPrice]);
      return totals;
    },
    {
      completedQuantity: 0,
      scrapQuantity: 0,
      unitWeight: 0,
      completedWeight: 0,
      jointCount: 0,
      totalPrice: 0,
    },
  );
}
