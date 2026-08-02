// content-scripts/test-calc.js

// Duplicated pure function for testing purposes in Node environment
function calcCanLeave(delivered, attended) {
  if (delivered === 0) {
    return '—';
  }
  const ratio = attended / delivered;
  if (ratio >= 0.75) {
    return Math.floor(attended / 0.75 - delivered);
  } else {
    return -Math.ceil(3 * delivered - 4 * attended);
  }
}

const testCases = [
  { delivered: 0, attended: 0, expected: '—', desc: "Edge case: D = 0 (no data yet)" },
  { delivered: 10, attended: 9, expected: 2, desc: "Safe attendance: 90% (Can skip 2 classes)" },
  { delivered: 10, attended: 7, expected: -2, desc: "Below 75%: 70% (Must attend 2 consecutive classes)" },
  { delivered: 4, attended: 3, expected: 0, desc: "Exact 75% boundary (Can skip 0 classes)" },
  { delivered: 100, attended: 74, expected: -4, desc: "Below 75%: 74% (Must attend 4 consecutive classes)" },
  { delivered: 100, attended: 75, expected: 0, desc: "Exact 75% boundary (Can skip 0 classes)" }
];

let failed = 0;
testCases.forEach((tc, idx) => {
  const result = calcCanLeave(tc.delivered, tc.attended);
  if (result === tc.expected) {
    console.log(`PASS: Test ${idx + 1} - ${tc.desc} (D=${tc.delivered}, A=${tc.attended} => Result: ${result})`);
  } else {
    console.error(`FAIL: Test ${idx + 1} - ${tc.desc} (Expected: ${tc.expected}, Got: ${result})`);
    failed++;
  }
});

if (failed === 0) {
  console.log("All tests passed successfully!");
} else {
  process.exit(1);
}
