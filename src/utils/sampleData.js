export const SAMPLE_DATA_METADATA = {
  name:        "Pulse Digital — Demo Dataset",
  description: "50 fictional employees across 5 departments. Designed to demonstrate all 9 AttritionIQ modules. Safe to clear and replace with your own CSV.",
  totalRows:   50,
  departments: ["Sales", "Technical Support", "IT", "HR", "Digital Marketing"],
  currency:    "USD",
  highlights: [
    "High attrition in Sales & Technical Support",
    "3 High Risk employees in IT",
    "Strong retention in HR",
    "Gen Z concentration in Digital Marketing",
  ],

  sampleIds: [
    "E001","E002","E003","E004","E005","E006","E007","E008","E009","E010",
    "E011","E012","E013","E014","E015","E016","E017","E018","E019","E020",
    "E021","E022","E023","E024","E025","E026","E027","E028","E029","E030",
    "E031","E032","E033","E034","E035","E036","E037","E038","E039","E040",
    "E041","E042","E043","E044","E045","E046","E047","E048","E049","E050",
  ],
};

// Set untuk O(1) lookup — lebih cepat dari Array.includes() untuk 50+ IDs
const SAMPLE_ID_SET = new Set(SAMPLE_DATA_METADATA.sampleIds);

export function isSampleRow(row) {
  if (!row?.EmployeeID) return false;
  return SAMPLE_ID_SET.has(String(row.EmployeeID));
}

// Alias lebih deskriptif untuk dipakai di modul
export const isSampleEmployee = isSampleRow;

export function getSampleSummary() {
  const { totalRows, departments, name } = SAMPLE_DATA_METADATA;
  return `${totalRows} employees · ${departments.length} departments · ${name}`;
}

export function getSampleDepartments() {
  return [...SAMPLE_DATA_METADATA.departments];
}
