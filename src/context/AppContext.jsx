import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import Papa from "papaparse";


export const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

// ── Currency config ──
const CURRENCY_CONFIG = {
  USD: { symbol: "$", locale: "en-US", name: "US Dollar" },
  IDR: { symbol: "Rp", locale: "id-ID", name: "Indonesian Rupiah" },
  EUR: { symbol: "€", locale: "de-DE", name: "Euro" },
  GBP: { symbol: "£", locale: "en-GB", name: "British Pound" },
  SGD: { symbol: "S$", locale: "en-SG", name: "Singapore Dollar" },
};

export function getCurrencyConfig(currency = "USD") {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
}

export function formatCurrency(value, currency = "USD", compact = false) {
  const cfg = getCurrencyConfig(currency);
  const num = Number(value) || 0;
  if (compact) {
    if (currency === "IDR") {
      if (num >= 1_000_000_000) return `${cfg.symbol}${(num / 1_000_000_000).toFixed(1)}M`;
      if (num >= 1_000_000) return `${cfg.symbol}${(num / 1_000_000).toFixed(1)}jt`;
      if (num >= 1_000) return `${cfg.symbol}${(num / 1_000).toFixed(0)}rb`;
    } else {
      if (num >= 1_000_000) return `${cfg.symbol}${(num / 1_000_000).toFixed(1)}M`;
      if (num >= 1_000) return `${cfg.symbol}${(num / 1_000).toFixed(0)}K`;
    }
  }
  return `${cfg.symbol}${num.toLocaleString(cfg.locale)}`;
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

export function getGeneration(age) {
  if (age < 28) return "Gen Z";
  if (age <= 43) return "Millennial";
  if (age <= 59) return "Gen X";
  return "Baby Boomer";
}

export function getStatusColor(status) {
  const s = status?.toLowerCase() || "";
  if (s.includes("resigned")) return "#ef4444";
  if (s.includes("high risk")) return "#eab308";
  return "#22c55e";
}

export function getScoreColor(score, maxScore = 5, inverse = false) {
  const ratio = score / maxScore;
  if (inverse) {
    if (ratio > 0.7) return "#ef4444"; 
    if (ratio > 0.4) return "#eab308"; 
    return "#22c55e"; 
  } else {
    if (ratio >= 0.8) return "#22c55e"; 
    if (ratio >= 0.5) return "#eab308"; 
    return "#ef4444"; 
  }
}


// ── Fuzzy CSV column mapper ──const COLUMN_ALIASES = {
  EmployeeID: [
    "employeeid", "employee_id", "emp_id", "id", "empid", "employee id", "idkaryawan", "id pegawai", "no_pegawai", "nik",
    "empcode", "emp code", "kode karyawan", "nomor induk", "nip", "nrp"
  ],
  FirstName: [
    "firstname", "first_name", "first", "namadepan", "nama", "name", "nama_awal", "nama_karyawan",
    "fname", "givenname", "given_name", "nama depan", "nama_pertama"
  ],
  LastName: [
    "lastname", "last_name", "last", "namabelakang", "marga", "surname",
    "lname", "familyname", "family_name", "nama belakang", "nama_akhir"
  ],
  Department: [
    "department", "dept", "divisi", "division", "bagian", "departemen", "unit_kerja", "div",
    "team", "tim", "unit", "organization", "org", "fungsi", "dept_name", "department_name", "bidang"
  ],
  MonthlySalary: [
    "monthlysalary", "monthly_salary", "salary", "gaji", "gaji_bulanan", "sal", "monthly salary", "gaji bulanan",
    "pendapatan", "upah", "gajih", "base_salary", "gaji_perbulan", "salary_permonth", "income_monthly", "pay",
    "takehome", "take_home", "salary_idr", "gajipokok", "gaji pokok", "gaji bersih", "gaji_kotor", "gross_salary"
  ],
  OvertimeStatus: [
    "overtimestatus", "overtime_status", "overtime", "lembur", "ot", "over time", "status_lembur", "suka_lembur",
    "lembur_status", "is_overtime", "overtime_yn", "lembur_yn"
  ],
  JobSatisfaction: [
    "jobsatisfaction", "job_satisfaction", "satisfaction", "kepuasan", "satisf", "job satisfaction", "kepuasan_kerja",
    "skor_puas", "kepuasan_score", "job_rate", "feeling", "mood", "happy_score", "rating_kepuasan", "puas",
    "tingkat kepuasan", "score", "satisfaction_level"
  ],
  AttritionStatus: [
    "attritionstatus", "attrition_status", "attrition", "status", "statusattrisi", "status_keluar", "turnover", "status_karyawan",
    "keluar", "resign", "cabut", "out", "leave", "exit_status", "status_aktif", "status_keaktifan", "status_pegawai"
  ],
  YearsAtCompany: [
    "yearsatcompany", "years_at_company", "tenure", "lama_kerja", "years", "masa kerja", "yearsemployed", "masa_bakti",
    "pengalaman_di_sini", "masakerja", "lama_bekerja", "tahun_kerja", "thn_kerja", "tahun_bekerja", "total_years"
  ],
  Age: [
    "age", "umur", "usia", "thn", "tahun_lahir", "umur_karyawan", "usia_karyawan", "age_year", "usia_tahun", "thn_umur",
    "years_old", "age_years", "umur_tahun", "tahun_umur", "umur_thn", "usia_thn"
  ],
  PerformanceScore: [
    "performancescore", "performance", "kinerja", "skor_kinerja", "rating", "nilai_kinerja", "kpi",
    "performance_rating", "score_kinerja", "evaluation", "eval_score"
  ],
  WorkModel: [
    "workmodel", "work_model", "tipe_kerja", "remote", "onsite", "wfa", "wfh", "wfo", "sistem_kerja",
    "work_type", "work_location", "model_kerja", "jenis_pekerjaan"
  ],
  CommuteDistance: [
    "commutedistance", "commute", "jarak_tempuh", "jarak", "jarak_rumah", "distance",
    "commute_distance", "jarak_tempat_tinggal", "travel_distance", "jarak_kerja"
  ]
};

const EXTRA_ALIASES = {
  Age: ["umur_karyawan","usia_karyawan","age_year","usia_tahun","thn_umur","years_old"],
  MonthlySalary: ["gaji_perbulan","salary_permonth","income_monthly","pay","takehome","take_home","salary_idr"],
  Department: ["team","tim","unit","organization","org","fungsi"],
  AttritionStatus: ["keluar","resign","cabut","out","leave","exit_status"],
  JobSatisfaction: ["kepuasan_score","job_rate","feeling","mood","happy_score"],
};

Object.keys(EXTRA_ALIASES).forEach(key => {
  COLUMN_ALIASES[key] = [
    ...(COLUMN_ALIASES[key] || []),
    ...EXTRA_ALIASES[key]
  ];
});

function smartParseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val || String(val).trim() === "") return "";

  let str = String(val).toLowerCase().trim();

  if (str.endsWith("k")) return Number(str.replace("k","")) * 1000;
  if (str.endsWith("m")) return Number(str.replace("m","")) * 1_000_000;
  if (str.endsWith("jt")) return Number(str.replace("jt","")) * 1_000_000;
  if (str.endsWith("rb")) return Number(str.replace("rb","")) * 1000;

  str = str.replace(/\s/g, '');

if (str.includes(',') && str.includes('.')) {

  const withoutComma = str.replace(/,.*$/, '');
  const numberPart = withoutComma.replace(/\./g, '');
  return Number(numberPart);
}

if (str.includes(',') && !str.includes('.')) {
  const cleaned = str.replace(/,/g, '');
  const num = Number(cleaned);
  if (!isNaN(num)) return num;
}

if (str.includes('.') && !str.includes(',')) {
  const parts = str.split('.');
  if (parts.length > 2 || (parts[parts.length-1].length === 3 && parts.length === 2)) {
    str = str.replace(/\./g, '');
  }
}

  let cleanStr = str.replace(/[^\d.,-]/g, '');

  if (cleanStr.includes('.') && !cleanStr.includes(',')) {
    const parts = cleanStr.split('.');
    if (parts.length > 2 || parts[parts.length - 1].length === 3) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }

  cleanStr = cleanStr.replace(/,/g, '');

  const num = Number(cleanStr);
  return isNaN(num) ? str : num;
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[\s_\-\.]+/g, "").trim();
}

function similarity(a, b) {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  let matches = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  return matches / Math.max(s1.length, s2.length);
}

function mapHeader(raw) {
  const norm = normalizeHeader(raw);

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (normalizeHeader(canonical) === norm) return canonical;
    if (aliases.some(a => normalizeHeader(a) === norm)) return canonical;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const score = similarity(norm, normalizeHeader(alias));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = canonical;
      }
    }
  }

  if (bestScore > 0.7) return bestMatch;

  return raw;
}


const TEXT_NORMALIZATION = {
  AttritionStatus: {

    "resigned": "Resigned",
    "resign": "Resigned",
    "keluar": "Resigned",
    "cabut": "Resigned",
    "quit": "Resigned",
    "high risk": "High Risk",
    "risk": "High Risk",
    "berisiko": "High Risk",
    "active": "Active",
    "aktif": "Active",
    "still": "Active",
  },
  JobSatisfaction: {

    "sangat puas": 5,
    "puas": 4,
    "cukup": 3,
    "tidak puas": 2,
    "sangat tidak puas": 1,
    "very satisfied": 5,
    "satisfied": 4,
    "neutral": 3,
    "dissatisfied": 2,
    "very dissatisfied": 1,
    "excellent": 5,
    "good": 4,
    "average": 3,
    "poor": 2,
    "bad": 1,
  },
  OvertimeStatus: {
    "yes": "Yes",
    "y": "Yes",
    "1": "Yes",
    "true": "Yes",
    "no": "No",
    "n": "No",
    "0": "No",
    "false": "No",
    "lembur": "Yes",
    "tidak": "No",
  },
};

function normalizeTextValue(field, value) {
  if (!value) return value;
  const mapping = TEXT_NORMALIZATION[field];
  if (!mapping) return value;
  const lowerVal = String(value).toLowerCase().trim();

  if (mapping[lowerVal]) return mapping[lowerVal];

  return value;
}

function enrichRow(row) {
  const enriched = { ...row };

if (enriched.AttritionStatus) {
  enriched.AttritionStatus = normalizeTextValue('AttritionStatus', enriched.AttritionStatus);
}
if (enriched.OvertimeStatus) {
  enriched.OvertimeStatus = normalizeTextValue('OvertimeStatus', enriched.OvertimeStatus);
}
if (enriched.JobSatisfaction && typeof enriched.JobSatisfaction === 'string') {

  const mapped = normalizeTextValue('JobSatisfaction', enriched.JobSatisfaction);
  if (typeof mapped === 'number') enriched.JobSatisfaction = mapped;
}

  if (enriched.Age) {
    enriched.Generation = getGeneration(enriched.Age);
  }

  if (enriched.MonthlySalary) {
    if (enriched.MonthlySalary > 5000) enriched.SalaryLevel = "High";
    else if (enriched.MonthlySalary > 3000) enriched.SalaryLevel = "Medium";
    else enriched.SalaryLevel = "Low";
  }

  if (enriched.JobSatisfaction) {
    enriched.SatisfactionLabel =
      enriched.JobSatisfaction <= 2 ? "Low" :
      enriched.JobSatisfaction <= 4 ? "Medium" : "High";
  }

  return enriched;
}
         
export function parseCSV(text) {
  const results = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => mapHeader(header),
  });

  return results.data
  .map(row => {
    const cleanRow = {};
    for (const key in row) {
      cleanRow[key] = smartParseNumber(row[key]);
    }

    if (cleanRow.EmployeeID) cleanRow.EmployeeID = String(cleanRow.EmployeeID);

    return enrichRow(cleanRow);
  })
  .filter(r => r.EmployeeID);   
}  

const LS_COMPANY_KEY = "attritioniq_company";
const LS_DATA_KEY    = "attritioniq_data";

export function AppProvider({ children }) {
  const [company, setCompanyState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COMPANY_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [data, setDataState] = useState(() => {
    const [riskThresholds, setRiskThresholds] = useState({
  high: 5,
  medium: 3
});
    try {
      const saved = localStorage.getItem(LS_DATA_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const setCompany = useCallback((c) => {
    setCompanyState(c);
    try {
      if (c) localStorage.setItem(LS_COMPANY_KEY, JSON.stringify(c));
      else localStorage.removeItem(LS_COMPANY_KEY);
    } catch {}
  }, []);

  const setData = useCallback((rows) => {
    setDataState(rows);
    try {
      if (rows && rows.length > 0) localStorage.setItem(LS_DATA_KEY, JSON.stringify(rows));
      else localStorage.removeItem(LS_DATA_KEY);
    } catch {}
  }, []);

  const resetWorkspace = useCallback(() => {
    setCompanyState(null);
    setDataState([]);
    try {
      localStorage.removeItem(LS_COMPANY_KEY);
      localStorage.removeItem(LS_DATA_KEY);
    } catch {}
  }, []);

  const computed = useMemo(() => {
  if (!data || data.length === 0) return [];

  return data.map(d => {
    let riskScore = 0;
    if (d.OvertimeStatus === "Yes") riskScore += 2;
    if (d.JobSatisfaction <= 2) riskScore += 2;
    if (d.YearsAtCompany < 1) riskScore += 2;

    let riskLevel = "Low";
    if (riskScore >= riskThresholds.high) riskLevel = "High";
    else if (riskScore >= riskThresholds.medium) riskLevel = "Medium";

    return {
      ...d,
      RiskScore: riskScore,
      RiskLevel: riskLevel,
      RiskColor:
        riskLevel === "High" ? "#ef4444" :
        riskLevel === "Medium" ? "#eab308" :
        "#22c55e"
    };
  });
}, [data, riskThresholds]);

    const contextValue = useMemo(() => ({
  company,
  setCompany,
  data,
  setData,
  computed,
  resetWorkspace,
  riskThresholds,
  setRiskThresholds
}), [company, data, computed, setCompany, setData, resetWorkspace, riskThresholds, setRiskThresholds]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
