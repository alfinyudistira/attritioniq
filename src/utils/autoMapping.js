export const CANONICAL_FIELDS = [
  "EmployeeID",
  "FirstName",
  "LastName",
  "Department",
  "MonthlySalary",
  "OvertimeStatus",
  "JobSatisfaction",
  "AttritionStatus",
  "YearsAtCompany",
  "Age",
  "PerformanceScore",
  "WorkModel",
  "MaritalStatus",
  "CommuteDistance",
  "EducationLevel",
];

export const REQUIRED_FIELDS   = ["EmployeeID", "Department", "AttritionStatus"];
export const IMPORTANT_FIELDS  = ["MonthlySalary", "JobSatisfaction", "YearsAtCompany", "Age", "OvertimeStatus"];
export const OPTIONAL_FIELDS   = ["PerformanceScore", "WorkModel", "CommuteDistance", "FirstName", "LastName" "MaritalStatus", "EducationLevel"];

const ALIASES = {
  EmployeeID: [
    "employeeid","employee_id","emp_id","id","empid","employee id",
    "idkaryawan","id pegawai","no_pegawai","nik","empcode","emp code",
    "kode karyawan","nomor induk","nip","nrp","staff_id","staffid",
    "worker_id","workerid","personid","person_id","userid","user_id",
    "employee_number","emp_number","employee_no","emp_no","no_karyawan",
    "nomor_karyawan","id_karyawan","karyawan_id",
  ],
  FirstName: [
    "firstname","first_name","first","namadepan","nama","name",
    "nama_awal","nama_karyawan","fname","givenname","given_name",
    "nama depan","nama_pertama","namapertama","preferred_name",
    "employee_name","nama_lengkap","full_name","fullname",
  ],
  LastName: [
    "lastname","last_name","last","namabelakang","marga","surname",
    "lname","familyname","family_name","nama belakang","nama_akhir",
    "namaakhir","namakelaurga","nama_keluarga",
  ],
  Department: [
    "department","dept","divisi","division","bagian","departemen",
    "unit_kerja","div","team","tim","unit","organization","org",
    "fungsi","dept_name","department_name","bidang","departement",
    "departmen","departmant","cost_center","costcenter","section",
    "group","work_unit","workunit","area","sub_division",
  ],
  MonthlySalary: [
    "monthlysalary","monthly_salary","salary","gaji","gaji_bulanan",
    "sal","monthly salary","gaji bulanan","pendapatan","upah","gajih",
    "base_salary","gaji_perbulan","salary_permonth","income_monthly",
    "pay","takehome","take_home","salary_idr","gajipokok","gaji pokok",
    "gaji bersih","gaji_kotor","gross_salary","monthly_income",
    "monthly_pay","monthly_wage","wage","income","compensation",
    "monthly_compensation","basic_salary","basicsal","basicpay",
    "total_salary","total_pay","net_salary","netsalary",
    // format IDR eksplisit
    "gaji_idr","salary_idr","gaji_rupiah","pendapatan_bulanan",
    // format compact
    "sal_monthly","monthly_sal",
  ],
  OvertimeStatus: [
    "overtimestatus","overtime_status","overtime","lembur","ot",
    "over time","status_lembur","suka_lembur","lembur_status",
    "is_overtime","overtime_yn","lembur_yn","over_time",
    "ot_status","kerja_lembur","lembur_reguler","extra_hours",
    "additional_hours","work_overtime","overwork","overworked",
  ],
  JobSatisfaction: [
    "jobsatisfaction","job_satisfaction","satisfaction","kepuasan",
    "satisf","job satisfaction","kepuasan_kerja","skor_puas",
    "kepuasan_score","job_rate","feeling","mood","happy_score",
    "rating_kepuasan","puas","tingkat kepuasan","score",
    "satisfaction_level","satisfactionlevel","work_satisfaction",
    "employee_satisfaction","emp_satisfaction","job_score",
    "engagement","employee_engagement","engagement_score",
    "happiness","happiness_score","wellbeing_score","wellbeing",
    "survey_score","pulse_score","esat","e_sat",
    // variasi typo umum
    "satifaction","satisfacion","satisfacton",
  ],
  AttritionStatus: [
    "attritionstatus","attrition_status","attrition","status",
    "statusattrisi","status_keluar","turnover","status_karyawan",
    "keluar","resign","cabut","out","leave","exit_status",
    "status_aktif","status_keaktifan","status_pegawai",
    "employment_status","emp_status","employee_status",
    "work_status","termination_status","separation_status",
    "still_employed","is_active","active_status","churn",
    "churn_status","flight_risk","retention_status",
    "left","left_company","has_left","employee_left",
    "voluntarily_left","resigned","is_resigned",
  ],
  YearsAtCompany: [
    "yearsatcompany","years_at_company","tenure","lama_kerja",
    "years","masa kerja","yearsemployed","masa_bakti",
    "pengalaman_di_sini","masakerja","lama_bekerja","tahun_kerja",
    "thn_kerja","tahun_bekerja","total_years","years_of_service",
    "service_years","length_of_service","seniority","company_tenure",
    "employment_duration","duration","lama_bergabung","masa_bergabung",
    "years_employed","month_at_company","months_at_company",
  ],
  Age: [
    "age","umur","usia","thn","tahun_lahir","umur_karyawan",
    "usia_karyawan","age_year","usia_tahun","thn_umur","years_old",
    "age_years","umur_tahun","tahun_umur","umur_thn","usia_thn",
    "employee_age","emp_age","age_band","age_group",
  ],
  PerformanceScore: [
    "performancescore","performance","kinerja","skor_kinerja",
    "rating","nilai_kinerja","kpi","performance_rating",
    "score_kinerja","evaluation","eval_score","perf_score",
    "performance_score","perf_rating","annual_rating",
    "review_score","appraisal","appraisal_score","appraisal_rating",
    "last_rating","latest_rating","performance_review",
    "nilai_kinerja","skor_performa","performa",
  ],
  WorkModel: [
    "workmodel","work_model","tipe_kerja","remote","onsite","wfa",
    "wfh","wfo","sistem_kerja","work_type","work_location",
    "model_kerja","jenis_pekerjaan","work_arrangement",
    "working_model","working_arrangement","hybrid","work_setup",
    "work_mode","employment_type","location_type","office_status",
  ],
  CommuteDistance: [
    "commutedistance","commute","jarak_tempuh","jarak","jarak_rumah",
    "distance","commute_distance","jarak_tempat_tinggal",
    "travel_distance","jarak_kerja","distance_from_home",
    "distancefromhome","home_distance","commute_km","distance_km",
    "jarak_km","travel_time","commute_time","jarak_rumah_km",
  ],
  MaritalStatus: [
    "maritalstatus", "marital_status", "status_pernikahan", 
    "pernikahan", "menikah", "hubungan", "widowed", "widow", "widower",
    "relationship", "hubungan", "relationship_status", "family_status",
  ],
  EducationLevel: [
  "educationlevel", "education_level", "education", "edu_level", "edulevel",
  "pendidikan", "tingkat_pendidikan", "tingkat pendidikan", "level_pendidikan",
  "jenjang_pendidikan", "lulusan", "gelar", "degree", "academic_degree",
  "qualification","kualifikasi", "last_education", "lasteducation", "pendidikan_terakhir",
  "pendidikan terakhir", "highest_education", "highesteducation", "formal_education",
  "riwayat_pendidikan", "education_background"
  ],
};

// ── Shared string utilities ───────────────────────────────────────────────────

export function normalizeHeaderStr(h) {
  return String(h).toLowerCase().replace(/[\s_\-\.]+/g, "").trim();
}

function levenshteinSimilarity(a, b) {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : (maxLen - costs[s2.length]) / maxLen;
}

export function mapSingleHeader(rawHeader) {
  const norm = normalizeHeaderStr(rawHeader);

  // 1. Exact match against canonical field names
  for (const canonical of CANONICAL_FIELDS) {
    if (normalizeHeaderStr(canonical) === norm) {
      return { canonical, confidence: 1.0, method: "exact" };
    }
  }

  // 2. Exact match against aliases
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (aliases.some(a => normalizeHeaderStr(a) === norm)) {
      return { canonical, confidence: 0.95, method: "alias" };
    }
  }

  // 3. Fuzzy match against all aliases (Levenshtein)
  let bestCanonical = null;
  let bestScore     = 0;
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      const score = levenshteinSimilarity(norm, normalizeHeaderStr(alias));
      if (score >= 0.75 && score > bestScore) {
        bestScore     = score;
        bestCanonical = canonical;
      }
    }
  }
  if (bestCanonical) {
    return { canonical: bestCanonical, confidence: bestScore, method: "fuzzy" };
  }

  return null;
}

export function autoMapFields(headers = [], template = CANONICAL_FIELDS) {
  return template.map(wanted => {
    // Try direct match first for speed
    const direct = headers.find(h => normalizeHeaderStr(h) === normalizeHeaderStr(wanted));
    if (direct) return direct;

    // Try alias + fuzzy match
    const result = mapSingleHeader(wanted);
    if (!result) return null;

    // Find which raw header produced this canonical
    const matchedRaw = headers.find(h => {
      const r = mapSingleHeader(h);
      return r?.canonical === result.canonical;
    });
    return matchedRaw || null;
  });
}

export function getMappingReport(rawHeaders = []) {
  const mapped   = [];   // { rawHeader, canonical, confidence, method }
  const unmapped = [];   // rawHeaders that didn't map to anything
  const usedCanonicals = new Set();

  for (const raw of rawHeaders) {
    const result = mapSingleHeader(raw);
    if (result && !usedCanonicals.has(result.canonical)) {
      mapped.push({ rawHeader: raw, ...result });
      usedCanonicals.add(result.canonical);
    } else if (!result) {
      unmapped.push(raw);
    }
    else {
      unmapped.push(raw);
    }
  }

  const foundCanonicals  = mapped.map(m => m.canonical);
  const missingRequired  = REQUIRED_FIELDS.filter(f => !foundCanonicals.includes(f));
  const missingImportant = IMPORTANT_FIELDS.filter(f => !foundCanonicals.includes(f));
  const missingOptional  = OPTIONAL_FIELDS.filter(f => !foundCanonicals.includes(f));

  const coverageScore = Math.round(
    ((foundCanonicals.filter(c => REQUIRED_FIELDS.includes(c)).length / REQUIRED_FIELDS.length) * 0.5 +
     (foundCanonicals.filter(c => IMPORTANT_FIELDS.includes(c)).length / IMPORTANT_FIELDS.length) * 0.35 +
     (foundCanonicals.filter(c => OPTIONAL_FIELDS.includes(c)).length / OPTIONAL_FIELDS.length) * 0.15) * 100
  );

  const fuzzyMappings = mapped.filter(m => m.method === "fuzzy");

  return {
    mapped,
    unmapped,
    foundCanonicals,
    missingRequired,
    missingImportant,
    missingOptional,
    coverageScore,       
    fuzzyMappings,       
    isViable: missingRequired.length === 0,  
    totalRaw: rawHeaders.length,
  };
}

export function detectExtraColumns(rawHeaders = []) {
  return rawHeaders.filter(h => !mapSingleHeader(h));
}

export function inferColumnType(sampleValues = []) {
  const nonEmpty = sampleValues.filter(v => v !== null && v !== undefined && String(v).trim() !== "");
  if (nonEmpty.length === 0) return "empty";

  const numericCount = nonEmpty.filter(v => !isNaN(Number(String(v).replace(/[,.\s]/g, "")))).length;
  if (numericCount / nonEmpty.length >= 0.8) return "number";

  const boolLike = new Set(["yes","no","true","false","1","0","ya","tidak","y","n"]);
  const boolCount = nonEmpty.filter(v => boolLike.has(String(v).toLowerCase().trim())).length;
  if (boolCount / nonEmpty.length >= 0.8) return "boolean";

  const uniqueValues = new Set(nonEmpty.map(v => String(v).toLowerCase().trim()));
  if (uniqueValues.size <= Math.min(10, nonEmpty.length * 0.3)) return "category";

  return "text";
}

export function normalizeJobSatisfaction(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 10) return Math.round(num * 10) / 10;
    if (num >= 1 && num <= 5) return Math.round(num * 2);
    if (num > 10 && num <= 100) return Math.max(1, Math.min(10, Math.round(num / 10)));
  }

  const str = String(value).toLowerCase().trim();

  const textToNumber = {
    // ── Skala teks EN (umum di survey HR global) ──
    "very low": 1, "verylow": 1, "extremely low": 1, "extremely dissatisfied": 1,
    "very dissatisfied": 1, "strongly dissatisfied": 1,
    "terendah": 1, "sangat rendah": 1, "lowest": 1, "1": 1,
    "sangat tidak puas": 1, "parah": 1, "bad": 1, "terrible": 1, "awful": 1,

    "low": 2, "rendah": 2, "2": 2, "jelek": 2, "dissatisfied": 2,
    "not satisfied": 2, "unhappy": 2, "tidak puas": 2, "kurang puas": 2,

    "somewhat low": 3, "agak rendah": 3, "below average": 3, "3": 3,
    "slightly dissatisfied": 3, "poor": 3, "kurang": 3,
    "somewhat dissatisfied": 3, "mostly dissatisfied": 3,

    "slightly low": 4, "4": 4, "below neutral": 4, "agak kurang": 4,
    "somewhat poor": 4, "slightly unhappy": 4,

    "medium": 5, "average": 5, "cukup": 5, "sedang": 5, "5": 5,
    "b aja": 5, "lumayan": 5, "neutral": 5, "moderate": 5, "so-so": 5,
    "biasa": 5, "biasa saja": 5, "ok": 5, "okay": 5, "fair": 5,
    "neither": 5, "mixed": 5, "indifferent": 5, "middle": 5,

    "somewhat high": 6, "above average": 6, "agak tinggi": 6, "6": 6,
    "somewhat satisfied": 6, "mostly satisfied": 6, "cukup puas": 6,
    "slightly satisfied": 6, "above neutral": 6,

    "high": 7, "tinggi": 7, "7": 7, "puas": 7, "satisfied": 7, "good": 7,
    "happy": 7, "senang": 7, "baik": 7, "positif": 7, "positive": 7,

    "very high": 8, "veryhigh": 8, "sangat tinggi": 8, "8": 8,
    "very satisfied": 8, "sangat puas": 8, "very happy": 8,
    "mostly very satisfied": 8, "highly satisfied": 8,

    "extremely high": 9, "luar biasa": 9, "9": 9, "very very satisfied": 9,
    "almost perfect": 9, "outstanding": 9, "excellent": 9,

    "max": 10, "perfect": 10, "sempurna": 10, "10": 10,
    "extremely satisfied": 10, "best": 10, "top": 10, "100%": 10,

    // ── Skala 1–4 (IBM HR Analytics dataset format) ──
    // 1=Low, 2=Medium, 3=High, 4=Very High → di-map ke 1–10
    // Sudah di-handle via num <= 5 konversi di atas

    // ── Format bintang ──
    "★": 2, "★★": 4, "★★★": 6, "★★★★": 8, "★★★★★": 10,
    "1 star": 2, "2 stars": 4, "3 stars": 6, "4 stars": 8, "5 stars": 10,
    "1/5": 2, "2/5": 4, "3/5": 6, "4/5": 8, "5/5": 10,
  };

  if (textToNumber[str] !== undefined) return textToNumber[str];

  // Tangkap format "X/10", "X/5", "X out of 10", dll
  const outOf10 = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*10$/);
  if (outOf10) {
    const v = parseFloat(outOf10[1]);
    if (v >= 0 && v <= 10) return Math.round(v * 10) / 10;
  }
  const outOf5 = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*5$/);
  if (outOf5) {
    const v = parseFloat(outOf5[1]);
    if (v >= 0 && v <= 5) return Math.round(v * 2);
  }
  const outOf100 = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*100$|^(\d+(?:\.\d+)?)%$/);
  if (outOf100) {
    const v = parseFloat(outOf100[1] || outOf100[2]);
    if (v >= 0 && v <= 100) return Math.max(1, Math.min(10, Math.round(v / 10)));
  }

  return null;
}

export function validateMappedData(rows = []) {
  const warnings      = [];
  const errors        = [];
  const rowsWithIssues = [];

  if (rows.length === 0) {
    errors.push("No rows found after parsing.");
    return { valid: false, warnings, errors, rowsWithIssues };
  }

  const ids     = rows.map(r => r.EmployeeID).filter(Boolean);
  const idSet   = new Set(ids);
  if (idSet.size < ids.length) {
    warnings.push(`${ids.length - idSet.size} duplicate EmployeeID(s) found — last occurrence will be used.`);
  }

  let missingIDCount   = 0;
  let missingSalCount  = 0;
  let negSalCount      = 0;
  let badSatCount      = 0;
  let badAgeCount      = 0;
  let badTenureCount   = 0;

  rows.forEach((row, i) => {
    const issues = [];

    if (!row.EmployeeID) { missingIDCount++; issues.push("missing EmployeeID"); }

    if (row.MonthlySalary !== undefined) {
      if (row.MonthlySalary === "" || row.MonthlySalary === null) { missingSalCount++; issues.push("missing MonthlySalary"); }
      else if (Number(row.MonthlySalary) < 0) { negSalCount++; issues.push("negative MonthlySalary"); }
    }

    if (row.JobSatisfaction !== undefined && row.JobSatisfaction !== "") {
      const normalized = normalizeJobSatisfaction(row.JobSatisfaction);
      const sat = normalized !== null ? normalized : Number(row.JobSatisfaction);
      if (isNaN(sat) || sat < 1 || sat > 10) { badSatCount++; issues.push("JobSatisfaction out of range 1–10"); }
    }

    if (row.Age !== undefined && row.Age !== "") {
      const age = Number(row.Age);
      if (isNaN(age) || age < 15 || age > 80) { badAgeCount++; issues.push("Age out of range 15–80"); }
    }

    if (row.YearsAtCompany !== undefined && row.YearsAtCompany !== "") {
      const tenure = Number(row.YearsAtCompany);
      if (isNaN(tenure) || tenure < 0 || tenure > 60) { badTenureCount++; issues.push("YearsAtCompany out of range 0–60"); }
    }

    if (issues.length > 0) rowsWithIssues.push({ rowIndex: i + 1, employeeId: row.EmployeeID || "?", issues });
  });

  if (missingIDCount > 0)  errors.push(`${missingIDCount} row(s) missing EmployeeID — these rows were excluded.`);
  if (missingSalCount > 0) warnings.push(`${missingSalCount} row(s) missing MonthlySalary — salary analytics may be incomplete.`);
  if (negSalCount > 0)     warnings.push(`${negSalCount} row(s) have negative MonthlySalary — check your data.`);
  if (badSatCount > 0)     warnings.push(`${badSatCount} row(s) have JobSatisfaction outside 1–10 — risk scoring may be affected.`);
  if (badAgeCount > 0)     warnings.push(`${badAgeCount} row(s) have Age outside 15–80 — generation tagging may be wrong.`);
  if (badTenureCount > 0)  warnings.push(`${badTenureCount} row(s) have YearsAtCompany outside 0–60 — tenure analytics may be affected.`);

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    rowsWithIssues: rowsWithIssues.slice(0, 20), 
    summary: {
      totalRows: rows.length,
      issueRows: rowsWithIssues.length,
      warningCount: warnings.length,
      errorCount: errors.length,
    },
  };
}
