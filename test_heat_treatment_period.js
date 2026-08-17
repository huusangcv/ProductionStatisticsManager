const assert = require('assert');
const { getHeatTreatmentPeriod, getPeriodDateRange, applyHeatTreatmentRules } = require('./src/electron/heatTreatment/heatTreatmentRules');

// ==========================================
// 1. Test Period Calculation Cases
// ==========================================
function testPeriodCalculation() {
    console.log('--- Testing Period Calculation ---');

    const cases = [
        // Case 1: 25/06/2026 -> 06/2026
        { date: '2026-06-25', expYear: 2026, expMonth: 6, expStart: '2026-05-26', expEnd: '2026-06-25' },
        // Case 2: 26/06/2026 -> 07/2026
        { date: '2026-06-26', expYear: 2026, expMonth: 7, expStart: '2026-06-26', expEnd: '2026-07-25' },
        // Case 3: 25/07/2026 -> 07/2026
        { date: '2026-07-25', expYear: 2026, expMonth: 7, expStart: '2026-06-26', expEnd: '2026-07-25' },
        // Case 4: 26/07/2026 -> 08/2026
        { date: '2026-07-26', expYear: 2026, expMonth: 8, expStart: '2026-07-26', expEnd: '2026-08-25' },
        // Case 5: 25/12/2026 -> 12/2026
        { date: '2026-12-25', expYear: 2026, expMonth: 12, expStart: '2026-11-26', expEnd: '2026-12-25' },
        // Case 6: 26/12/2026 -> 01/2027
        { date: '2026-12-26', expYear: 2027, expMonth: 1, expStart: '2026-12-26', expEnd: '2027-01-25' },
        // Case 7: 25/01/2027 -> 01/2027
        { date: '2027-01-25', expYear: 2027, expMonth: 1, expStart: '2026-12-26', expEnd: '2027-01-25' },
        // Case 8: 26/01/2027 -> 02/2027
        { date: '2027-01-26', expYear: 2027, expMonth: 2, expStart: '2027-01-26', expEnd: '2027-02-25' },
    ];

    for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        const res = getHeatTreatmentPeriod(tc.date);
        try {
            assert.strictEqual(res.periodYear, tc.expYear, `Case ${i+1}: expected year ${tc.expYear}, got ${res.periodYear}`);
            assert.strictEqual(res.periodMonth, tc.expMonth, `Case ${i+1}: expected month ${tc.expMonth}, got ${res.periodMonth}`);
            assert.strictEqual(res.startDate, tc.expStart, `Case ${i+1}: expected start ${tc.expStart}, got ${res.startDate}`);
            assert.strictEqual(res.endDate, tc.expEnd, `Case ${i+1}: expected end ${tc.expEnd}, got ${res.endDate}`);
            console.log(`✅ Case ${i+1} passed: ${tc.date} -> ${res.periodStr}/${res.periodYear} (${res.startDate} to ${res.endDate})`);
        } catch (err) {
            console.error(`❌ Case ${i+1} failed: ${err.message}`);
        }
    }
}

// ==========================================
// 2. Test DB Query and Aggregation
// ==========================================
function testDbAggregation() {
    console.log('\n--- Testing DB Query & Aggregation ---');
    
    // Data setup - need specification to start with "DN" so it's classified as XLN, and contain WCB so it counts as WCB weight
    const spec = 'DN50 WCB'; 
    const grindingRows = [
        { report_date: '2026-06-25', completed_quantity: 1, unit_weight: 10, completed_weight: 10, specification: spec, item_name: 'Test' }, // Outside
        { report_date: '2026-06-26', completed_quantity: 1, unit_weight: 20, completed_weight: 20, specification: spec, item_name: 'Test' }, // Inside
        { report_date: '2026-06-30', completed_quantity: 1, unit_weight: 30, completed_weight: 30, specification: spec, item_name: 'Test' }, // Inside
        { report_date: '2026-07-01', completed_quantity: 1, unit_weight: 40, completed_weight: 40, specification: spec, item_name: 'Test' }, // Inside
        { report_date: '2026-07-24', completed_quantity: 1, unit_weight: 50, completed_weight: 50, specification: spec, item_name: 'Test' }, // Inside
        { report_date: '2026-07-25', completed_quantity: 1, unit_weight: 60, completed_weight: 60, specification: spec, item_name: 'Test' }, // Inside
        { report_date: '2026-07-26', completed_quantity: 1, unit_weight: 70, completed_weight: 70, specification: spec, item_name: 'Test' }, // Outside
    ];

    const { startDate, endDate } = getPeriodDateRange(2026, 7);
    const filteredRows = grindingRows.filter(r => r.report_date >= startDate && r.report_date <= endDate);

    const groupedByDate = new Map();
    for (const row of filteredRows) {
        const date = row.report_date;
        if (!groupedByDate.has(date)) groupedByDate.set(date, []);
        groupedByDate.get(date).push(row);
    }

    const dataByDate = new Map();
    let totalWeight = 0;
    for (const [date, rows] of groupedByDate) {
        const result = applyHeatTreatmentRules(rows);
        dataByDate.set(date, {
            wcb_weight: result.wcbWeight,
            other_weight: result.otherWeight,
            total_weight: result.totalWeight,
        });
        totalWeight += result.totalWeight;
    }

    try {
        assert.strictEqual(dataByDate.size, 5, `Expected 5 days with data, got ${dataByDate.size}`);
        assert.strictEqual(totalWeight, 200, `Expected total weight 200, got ${totalWeight}`);
        console.log(`✅ DB Aggregation passed: Total Weight = ${totalWeight} across ${dataByDate.size} days.`);
        console.log(`Dates included: ${Array.from(dataByDate.keys()).join(', ')}`);
    } catch (err) {
        console.error(`❌ DB Aggregation failed: ${err.message}`);
    }
}

testPeriodCalculation();
testDbAggregation();
