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

export const SAMPLE_DATA = [
  { EmployeeID:"E001", FirstName:"Alex", LastName:"Carter", Department:"Sales", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:27 },
  { EmployeeID:"E002", FirstName:"Sarah", LastName:"Miller", Department:"Sales", MonthlySalary:4900, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:3.0, Age:29 },
  { EmployeeID:"E003", FirstName:"James", LastName:"Wu", Department:"Sales", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.5, Age:24 },
  { EmployeeID:"E004", FirstName:"Maya", LastName:"Patel", Department:"Sales", MonthlySalary:4500, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:31 },
  { EmployeeID:"E005", FirstName:"Tom", LastName:"Reed", Department:"Sales", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E006", FirstName:"Nina", LastName:"Brooks", Department:"Sales", MonthlySalary:4700, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:33 },
  { EmployeeID:"E007", FirstName:"Chris", LastName:"Park", Department:"Sales", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.8, Age:25 },
  { EmployeeID:"E008", FirstName:"Laura", LastName:"Singh", Department:"Sales", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E009", FirstName:"Kevin", LastName:"Zhao", Department:"Sales", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:23 },
  { EmployeeID:"E010", FirstName:"Ella", LastName:"Turner", Department:"Sales", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E011", FirstName:"Ben", LastName:"Adams", Department:"Sales", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.2, Age:27 },
  { EmployeeID:"E012", FirstName:"Zara", LastName:"King", Department:"Sales", MonthlySalary:4800, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:3.0, Age:35 },
  { EmployeeID:"E013", FirstName:"Leo", LastName:"Chen", Department:"Technical Support", MonthlySalary:4000, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E014", FirstName:"Mia", LastName:"Evans", Department:"Technical Support", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E015", FirstName:"Ryan", LastName:"Scott", Department:"Technical Support", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.5, Age:24 },
  { EmployeeID:"E016", FirstName:"Ava", LastName:"Morris", Department:"Technical Support", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E017", FirstName:"Jake", LastName:"Lewis", Department:"Technical Support", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:27 },
  { EmployeeID:"E018", FirstName:"Sofia", LastName:"Walker", Department:"Technical Support", MonthlySalary:4700, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:32 },
  { EmployeeID:"E019", FirstName:"Ethan", LastName:"Hall", Department:"Technical Support", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.8, Age:25 },
  { EmployeeID:"E020", FirstName:"Lily", LastName:"Young", Department:"Technical Support", MonthlySalary:4400, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:29 },
  { EmployeeID:"E021", FirstName:"Tom", LastName:"Holland", Department:"IT", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:27 },
  { EmployeeID:"E022", FirstName:"Zendaya", LastName:"Coleman", Department:"IT", MonthlySalary:4000, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E023", FirstName:"Chris", LastName:"Evans", Department:"IT", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E024", FirstName:"Robert", LastName:"Downey", Department:"IT", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:24 },
  { EmployeeID:"E025", FirstName:"Scarlett", LastName:"Jo", Department:"IT", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:29 },
  { EmployeeID:"E026", FirstName:"Chris", LastName:"Hemsworth", Department:"IT", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E027", FirstName:"Mark", LastName:"Ruffalo", Department:"IT", MonthlySalary:4500, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.5, Age:31 },
  { EmployeeID:"E028", FirstName:"Risk", LastName:"User3", Department:"IT", MonthlySalary:4900, OvertimeStatus:"Yes", JobSatisfaction:4, AttritionStatus:"High Risk", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E029", FirstName:"HR", LastName:"Admin1", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E030", FirstName:"HR", LastName:"Admin2", Department:"HR", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:36 },
  { EmployeeID:"E031", FirstName:"HR", LastName:"Admin3", Department:"HR", MonthlySalary:5000, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E032", FirstName:"HR", LastName:"Admin4", Department:"HR", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:38 },
  { EmployeeID:"E033", FirstName:"HR", LastName:"Admin5", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E034", FirstName:"Sales", LastName:"Active1", Department:"Sales", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:36 },
  { EmployeeID:"E035", FirstName:"Tech", LastName:"Active1", Department:"Technical Support", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.5, Age:34 },
  { EmployeeID:"E036", FirstName:"Tech", LastName:"Active2", Department:"Technical Support", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:37 },
  { EmployeeID:"E037", FirstName:"IT", LastName:"Active1", Department:"IT", MonthlySalary:5000, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E038", FirstName:"IT", LastName:"Active2", Department:"IT", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:35 },
  { EmployeeID:"E039", FirstName:"HR", LastName:"Staff3", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E040", FirstName:"Sales", LastName:"Active2", Department:"Sales", MonthlySalary:5400, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:38 },
  { EmployeeID:"E041", FirstName:"DM", LastName:"Kevin1", Department:"Digital Marketing", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:22 },
  { EmployeeID:"E042", FirstName:"DM", LastName:"Kevin2", Department:"Digital Marketing", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:23 },
  { EmployeeID:"E043", FirstName:"Risk", LastName:"User1", Department:"IT", MonthlySalary:4800, OvertimeStatus:"Yes", JobSatisfaction:4, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:30 },
  { EmployeeID:"E044", FirstName:"Sales", LastName:"Active3", Department:"Sales", MonthlySalary:5600, OvertimeStatus:"No", JobSatisfaction:9, AttritionStatus:"Active", YearsAtCompany:6.0, Age:38 },
  { EmployeeID:"E045", FirstName:"Tech", LastName:"Active3", Department:"Technical Support", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.5, Age:36 },
  { EmployeeID:"E046", FirstName:"IT", LastName:"Active3", Department:"IT", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.5, Age:34 },
  { EmployeeID:"E047", FirstName:"Sales", LastName:"Active4", Department:"Sales", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E048", FirstName:"Tech", LastName:"Senior1", Department:"Technical Support", MonthlySalary:5400, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:37 },
  { EmployeeID:"E049", FirstName:"DM", LastName:"Senior1", Department:"Digital Marketing", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:34 },
  { EmployeeID:"E050", FirstName:"IT", LastName:"Senior1", Department:"IT", MonthlySalary:5500, OvertimeStatus:"No", JobSatisfaction:9, AttritionStatus:"Active", YearsAtCompany:5.5, Age:38 },
];
