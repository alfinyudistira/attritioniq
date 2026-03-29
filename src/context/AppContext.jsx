import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import { idbGet, idbSet, idbDelete } from "../hooks/useModularStorage";
import { mapSingleHeader, normalizeHeaderStr, normalizeJobSatisfaction } from "../utils/autoMapping";

export const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function useCompany() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useCompany must be used inside <AppProvider>");
  const { company, setCompany, resetWorkspace } = ctx;
  return { company, setCompany, resetWorkspace };
}

export function useCurrency() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useCurrency must be used inside <AppProvider>");
  const { company } = ctx;
  const currency = company?.currency || "USD";
  const fmt = useCallback(
    (val, compact = false) => formatCurrency(val, currency, compact),
    [currency]
  );
  return { currency, fmt, config: getCurrencyConfig(currency) };
}

export function useHRData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useHRData must be used inside <AppProvider>");
  const { data, setData, computed, appConfig, updateConfig, applyIntervention } = ctx;
  return { data, setData, computed, appConfig, updateConfig, applyIntervention };
}

// Hook for modules to detect when a new CSV session starts (to flush stale local state)
export function useDataSession() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useDataSession must be used inside <AppProvider>");
  return { dataSessionId: ctx.dataSessionId, isSampleData: ctx.isSampleData };
}

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
  const a = Number(age);
  if (!a || a <= 0) return "Unknown";
  if (a < 28) return "Gen Z";
  if (a <= 43) return "Millennial";
  return "Baby Boomer";
}

export function getStatusColor(status) {
  const s = String(status || "").toLowerCase();
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

function smartParseNumber(val) {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined || String(val).trim() === "") return "";

  let str = String(val).toLowerCase().trim();

  str = str.replace(/\s+/g, '').replace(/rp|\$|€|£|idr|usd/g, '').replace(/,-$/, '');

  let multiplier = 1;

  if (str.match(/[0-9](k|rb|ribu)$/)) { multiplier = 1e3; str = str.replace(/k|rb|ribu/g, ''); }
  else if (str.match(/[0-9](m|jt|juta)$/)) { multiplier = 1e6; str = str.replace(/m|jt|juta/g, ''); }
  else if (str.match(/[0-9](b|miliar|bio)$/)) { multiplier = 1e9; str = str.replace(/b|miliar|bio/g, ''); }
  else if (str.match(/[0-9](t|triliun)$/)) { multiplier = 1e12; str = str.replace(/t|triliun/g, ''); }
  
  let cleanStr = str.replace(/[^\d.,]/g, '');

  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    const lastDot = cleanStr.lastIndexOf('.');
    const lastComma = cleanStr.lastIndexOf(',');
    if (lastComma > lastDot) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.'); 
    } else {
      cleanStr = cleanStr.replace(/,/g, ''); 
    }
  } else if (cleanStr.includes(',')) {
    const parts = cleanStr.split(',');
    if (parts[parts.length - 1].length === 3) {
       cleanStr = cleanStr.replace(/,/g, ''); 
    } else {
       cleanStr = cleanStr.replace(',', '.');
    }
  } else if (cleanStr.includes('.')) {
     const parts = cleanStr.split('.');
     if (parts.length > 2 || parts[parts.length - 1].length === 3) {
        cleanStr = cleanStr.replace(/\./g, ''); 
     }
  }

  const num = Number(cleanStr) * multiplier;
  return isNaN(num) ? val : num; 
}

const TEXT_NORMALIZATION = {
  AttritionStatus: {
    "resigned": "Resigned", "resign": "Resigned", "keluar": "Resigned", "cabut": "Resigned", "quit": "Resigned", "rsgn": "Resigned", "out": "Resigned", "minggat": "Resigned",
    "high risk": "High Risk", "risk": "High Risk", "berisiko": "High Risk", "bahaya": "High Risk", "warning": "High Risk",
    "active": "Active", "aktif": "Active", "still": "Active", "stay": "Active", "aman": "Active", "bertahan": "Active",
  },
  OvertimeStatus: {
    "yes": "Yes", "y": "Yes", "1": "Yes", "true": "Yes", "ya": "Yes", "yoi": "Yes", "sering": "Yes", "lembur": "Yes", "ot": "Yes",
    "no": "No", "n": "No", "0": "No", "false": "No", "tidak": "No", "tdk": "No", "ngga": "No", "g": "No", "gk": "No", "engga": "No",
  },
  Department: {
    "hr": "HR", "hrd": "HR", "human resource": "HR", "human resources": "HR", "sdm": "HR", "personalia": "HR",
    "it": "IT", "information technology": "IT", "tech": "IT", "teknologi informasi": "IT", "engineer": "IT",
    "sales": "Sales", "penjualan": "Sales", "marketing": "Sales", "pemasaran": "Sales",
    "finance": "Finance", "keuangan": "Finance", "accounting": "Finance", "akuntansi": "Finance",
  }
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
  if (enriched.Department) {
  enriched.Department = normalizeTextValue('Department', enriched.Department);

  if (enriched.JobSatisfaction !== undefined) {
  enriched.SatisfactionLabel =
    enriched.JobSatisfaction <= 3  ? "Low" :
    enriched.JobSatisfaction <= 6  ? "Medium" :
    enriched.JobSatisfaction <= 8  ? "High" : "Very High";
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
    transformHeader: (header) => {
      const result = mapSingleHeader(header);
      return result ? result.canonical : header;
    },
  });

  return results.data
  .map(row => {
    const cleanRow = {};
        const numberFields = ["MonthlySalary", "Age", "YearsAtCompany",  "JobSatisfaction", "PerformanceScore", "CommuteDistance"];
    for (const key in row) {
      if (numberFields.includes(key)) {
        cleanRow[key] = smartParseNumber(row[key]);
      } else {
        cleanRow[key] = row[key]; 
      }
    }

    if (cleanRow.EmployeeID) cleanRow.EmployeeID = String(cleanRow.EmployeeID);

    return enrichRow(cleanRow);
  })
  .filter(r => r.EmployeeID);   
}  

const LS_COMPANY_KEY  = "attritioniq_company";
const LS_DATA_KEY     = "attritioniq_data";
const LS_CONFIG_KEY   = "attritioniq_config";
const LS_SESSION_KEY  = "attritioniq_session";
const LS_ISSAMPLE_KEY = "attritioniq_issample";

// Generates a short unique session ID — used to invalidate stale module storage
function generateSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AppProvider({ children }) {
  const [company, setCompanyState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_COMPANY_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

    const [data, setDataState] = useState([]);

  useEffect(() => {
    idbGet(LS_DATA_KEY).then((saved) => {
      if (saved && Array.isArray(saved)) {
        setDataState(saved);
      }
    });
  }, []);

  // Modules subscribe to this to know when to flush their local state
  const [dataSessionId, setDataSessionId] = useState(() => {
    try {
      return localStorage.getItem(LS_SESSION_KEY) || generateSessionId();
    } catch { return generateSessionId(); }
  });

  // ── Tracks whether current data is the built-in sample ──
  const [isSampleData, setIsSampleData] = useState(() => {
    try { return localStorage.getItem(LS_ISSAMPLE_KEY) === "1"; } catch { return false; }
  });

  const DEFAULT_CONFIG = {
    thresholds: { high: 30, medium: 15 },
    colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" },
  };

  const [appConfig, setAppConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("attritioniq_config");
      if (!saved) return DEFAULT_CONFIG;
      const parsed = JSON.parse(saved);
      
      return {
        thresholds: { ...DEFAULT_CONFIG.thresholds, ...(parsed.thresholds || {}) },
        colors: { ...DEFAULT_CONFIG.colors, ...(parsed.colors || {}) },
      };
    } catch { return DEFAULT_CONFIG; }
  });

  // ── M9 → M1 pulse override ──
  const [pulseOverride, setPulseOverrideState] = useState(() => {
    try {
      const saved = localStorage.getItem("attritioniq_pulse");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const setPulseOverride = useCallback((pulse) => {
    setPulseOverrideState(pulse);
    try {
      if (pulse) localStorage.setItem("attritioniq_pulse", JSON.stringify(pulse));
      else localStorage.removeItem("attritioniq_pulse");
    } catch {}
  }, []);
  
  const setCompany = useCallback((c) => {
    setCompanyState(c);
    try {
      if (c) localStorage.setItem(LS_COMPANY_KEY, JSON.stringify(c));
      else localStorage.removeItem(LS_COMPANY_KEY);
    } catch {}
  }, []);

  const setData = useCallback((rowsOrUpdater, opts = {}) => {
    setDataState(prev => {
      const rows = typeof rowsOrUpdater === "function" ? rowsOrUpdater(prev) : rowsOrUpdater;
      // Simpan ke IndexedDB: Aman untuk data raksasa (5MB+)
      if (rows && rows.length > 0) {
        idbSet(LS_DATA_KEY, rows).catch(err => console.error("IDB Save Error:", err));
      } else {
        idbDelete(LS_DATA_KEY);
      }
      return rows;
    });
    // Generate a new session ID so modules know to flush their stale local state.
    if (!opts.keepSession) {
      const newId = generateSessionId();
      setDataSessionId(newId);
      try { localStorage.setItem(LS_SESSION_KEY, newId); } catch {}
    }
  }, []);

  const updateConfig = useCallback((patch) => {
    setAppConfig(prev => {
      const next = {
        thresholds: { ...(prev.thresholds || {}), ...(patch.thresholds || {}) },
        colors: { ...(prev.colors || {}), ...(patch.colors || {}) },
      };
      try { localStorage.setItem("attritioniq_config", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

    const resetWorkspace = useCallback(() => {
    const freshId = generateSessionId();
    setCompanyState(null);
    setDataState([]);
    setPulseOverrideState(null);
    setDataSessionId(freshId);
    setIsSampleData(false);
    setAppConfig({
      thresholds: { high: 30, medium: 15 },
      colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" },
    });
        try {
      localStorage.removeItem(LS_COMPANY_KEY);
      idbDelete(LS_DATA_KEY);
      localStorage.removeItem("attritioniq_pulse");
      localStorage.removeItem(LS_CONFIG_KEY);
      localStorage.setItem(LS_SESSION_KEY, freshId);
      localStorage.removeItem(LS_ISSAMPLE_KEY);
    } catch {}
  }, []);

  const computed = useMemo(() => {
    if (!data || data.length === 0) return [];
    const thresholds = appConfig?.thresholds || { high: 30, medium: 15 };
    const colors = appConfig?.colors || { high: "#ef4444", medium: "#eab308", low: "#22c55e" };
    return data.map(d => {
      let riskScore = 0;

      // Factor 1: Overtime
      if (d.OvertimeStatus === "Yes") riskScore += 2;

      // Factor 2: Job satisfaction (scale 1–10)
      if (d.JobSatisfaction <= 2) riskScore += 3;
      else if (d.JobSatisfaction <= 4) riskScore += 2;
      else if (d.JobSatisfaction <= 6) riskScore += 1;

      // Factor 3: Tenure
      if (d.YearsAtCompany < 1) riskScore += 3;
      else if (d.YearsAtCompany < 2) riskScore += 2;
      else if (d.YearsAtCompany < 3) riskScore += 1;

      // Factor 4: Age / Gen Z signal
      if (d.Age && d.Age < 27) riskScore += 1;

      // Factor 5: Already flagged as attrition
      const statusLower = (d.AttritionStatus || "").toLowerCase();
      if (statusLower.includes("resigned")) riskScore += 4;
      else if (statusLower.includes("high risk")) riskScore += 3;

      // Normalize to 0–100
      const maxPossible = 13;
      const riskPct = Math.min(100, Math.round((riskScore / maxPossible) * 100));

      let riskLevel = "Low";
      if (riskPct >= thresholds.high) riskLevel = "High";
      else if (riskPct >= thresholds.medium) riskLevel = "Medium";
      return {
        ...d,
        RiskScore: riskScore,
        RiskPct: riskPct,
        RiskLevel: riskLevel,
        RiskColor:
          riskLevel === "High"   ? colors.high :
          riskLevel === "Medium" ? colors.medium :
          colors.low,
        Generation: getGeneration(d.Age),
      };
    });
  }, [data, appConfig]);

  const [notifications, setNotifications] = useState([]);
  const notifCounterRef = useRef(0);
  const pushNotification = useCallback((msg, type = "info") => {
    const id = `notif_${Date.now()}_${++notifCounterRef.current}`;
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const applyIntervention = useCallback((employeeId, updates) => {
    // keepSession: true — intervention updates should NOT trigger module state flush
    setData(prev => prev.map(emp =>
      emp.EmployeeID === employeeId ? { ...emp, ...updates } : emp
    ), { keepSession: true });
    pushNotification(`✅ ${employeeId} updated — all modules synced`, "success");
  }, [setData, pushNotification]);

  // Public setter for isSampleData — used by DataUpload when loading sample
  const setSampleDataFlag = useCallback((val) => {
    setIsSampleData(val);
    try {
      if (val) localStorage.setItem(LS_ISSAMPLE_KEY, "1");
      else localStorage.removeItem(LS_ISSAMPLE_KEY);
    } catch {}
  }, []);
  
  const contextValue = useMemo(() => ({
    company,
    setCompany,
    data,
    setData,
    computed,
    resetWorkspace,
    appConfig,
    updateConfig,
    notifications,
    pushNotification,
    pulseOverride,
    setPulseOverride,
    applyIntervention,
    dataSessionId,
    isSampleData,
    setSampleDataFlag,
  }), [
    company, data, computed, setCompany, setData, resetWorkspace,
    appConfig, updateConfig, notifications, pushNotification,
    pulseOverride, setPulseOverride, applyIntervention,
    dataSessionId, isSampleData, setSampleDataFlag,
  ]);
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
