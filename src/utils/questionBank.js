export const QUESTION_BANK = [
  { id: "q1",  text: "How manageable was your workload this week?",                  type: "scale", category: "Workload",      icon: "⚡" },
  { id: "q2",  text: "Do you feel recognized for your contributions?",               type: "scale", category: "Recognition",   icon: "🏆" },
  { id: "q3",  text: "How supported do you feel by your manager?",                   type: "scale", category: "Management",    icon: "👤" },
  { id: "q4",  text: "How likely are you to recommend this company as a workplace?", type: "scale", category: "eNPS",          icon: "📣" },
  { id: "q5",  text: "Do you have clear visibility into your career growth path?",   type: "scale", category: "Career",        icon: "📈" },
  { id: "q6",  text: "How balanced is your work-life this week?",                    type: "scale", category: "Wellbeing",     icon: "⚖️" },
  { id: "q7",  text: "Do you feel psychologically safe to speak up?",                type: "scale", category: "Safety",        icon: "🛡️" },
  { id: "q8",  text: "How connected do you feel to your team?",                      type: "scale", category: "Culture",       icon: "🤝" },
  { id: "q9",  text: "Were there any blockers preventing you from doing great work?",type: "text",  category: "Blockers",      icon: "🚧" },
  { id: "q10", text: "What's one thing leadership could do better this week?",       type: "text",  category: "Feedback",      icon: "💬" },
  { id: "q11", text: "How energized do you feel coming to work?",                    type: "scale", category: "Energy",        icon: "🔋" },
  { id: "q12", text: "How fair do you feel your compensation is?",                   type: "scale", category: "Compensation",  icon: "💰" },
  { id: "q13", text: "Do you have the right tools and resources to do your job effectively?", type: "scale", category: "Tools", icon: "🛠️" },
  { id: "q14", text: "Do you feel trusted to do your work with autonomy?",                    type: "scale", category: "Autonomy", icon: "🗝️" },
  { id: "q15", text: "Do you clearly understand how your work contributes to company goals?", type: "scale", category: "Alignment", icon: "🎯" },
  { id: "q16", text: "How confident are you in the future of this company?",                  type: "scale", category: "Confidence", icon: "🚀" },
  { id: "q17", text: "Do you feel people from all backgrounds have an equal chance to succeed here?", type: "scale", category: "Diversity", icon: "🌍" },
  { id: "q18", text: "Have you learned something new or developed a new skill in the past month?", type: "scale", category: "Growth", icon: "🌱" },
  { id: "q19", text: "Do you see yourself continuing to work here 12 months from now?",       type: "scale", category: "Retention", icon: "⚓" },
  { id: "q20", text: "How would you rate the quality of communication across different departments?", type: "scale", category: "Communication", icon: "📡" },
  { id: "q21", text: "Are expectations for your role clearly defined?",                       type: "scale", category: "Clarity", icon: "👓" },
  { id: "q22", text: "What is your proudest achievement at work recently?",                   type: "text",  category: "Highlights", icon: "✨" },
  { id: "q23", text: "If you were the CEO for a day, what is the first policy you would change?", type: "text", category: "Innovation", icon: "💡" },
  { id: "q24", text: "Are you comfortable bringing your authentic self to work?",             type: "scale", category: "Inclusion", icon: "🌈" },
  { id: "q25", text: "How often do you feel completely overwhelmed by your tasks?",           type: "scale", category: "Burnout", icon: "🔥" },
  { id: "q26", text: "Do you receive constructive feedback regularly?",                 type: "scale", category: "Feedback",      icon: "📝" },
  { id: "q27", text: "How satisfied are you with your current role?",                    type: "scale", category: "Satisfaction",  icon: "😊" },
  { id: "q28", text: "Do you feel your ideas are valued by your team?",                  type: "scale", category: "Recognition",   icon: "💡" },
  { id: "q29", text: "How well do different teams collaborate with each other?",        type: "scale", category: "Collaboration", icon: "🤝" },
  { id: "q30", text: "Do you feel your workload is fairly distributed within your team?", type: "scale", category: "Workload",     icon: "⚖️" },
  { id: "q31", text: "What is one thing that would improve your work experience?",      type: "text",  category: "Improvement",   icon: "🛠️" },
  { id: "q32", text: "Do you feel encouraged to take initiative at work?",              type: "scale", category: "Autonomy",      icon: "🚀" },
  { id: "q33", text: "How transparent is communication from leadership?",               type: "scale", category: "Leadership",    icon: "📢" },
  { id: "q34", text: "Do you feel your work is meaningful?",                            type: "scale", category: "Purpose",       icon: "🎯" },
  { id: "q35", text: "How comfortable are you asking for help when needed?",            type: "scale", category: "Support",       icon: "🙋" },
  { id: "q36", text: "What motivates you the most in your current job?",                type: "text",  category: "Motivation",    icon: "🔥" },
  { id: "q37", text: "Do you feel meetings are productive and efficient?",             type: "scale", category: "Meetings",      icon: "📅" },
  { id: "q38", text: "How well does your manager communicate expectations?",           type: "scale", category: "Management",    icon: "🧭" },
  { id: "q39", text: "Do you feel there is a culture of accountability in your team?", type: "scale", category: "Culture",       icon: "📌" },
  { id: "q40", text: "Is there anything else you would like to share?",                 type: "text",  category: "General",       icon: "🗨️" }
];

// ==========================
// ⚙️ CONFIG
// ==========================
export const CATEGORY_WEIGHT = {
  Burnout: 2.0,
  Workload: 1.5,
  Wellbeing: 2.0,
  eNPS: 1.8,
  Management: 1.5,
  Culture: 1.2,
  General: 1.0
};

export const SURVEY_CONFIG = {
  TOTAL_QUESTIONS: 6,
  SCALE_RATIO: 0.8, // 80% scale, 20% text
  ENABLE_BALANCED: true
};

// ==========================
// 🆔 UTIL: Generate ID (Enhanced)
// ==========================
/**
 * Generate a unique ID with optional prefix and timestamp.
 * @param {string} prefix - Prefix for the ID.
 * @returns {string} Unique ID.
 */
export function generateId(prefix = "svy") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ==========================
// 👤 USER CONTEXT (AUTO)
// ==========================
/**
 * Create user context for a survey session.
 * @param {Object} options - Configuration options.
 * @param {string|null} options.userId - Optional user identifier.
 * @param {string} options.team - Team name.
 * @param {boolean} options.anonymous - Whether the survey is anonymous.
 * @returns {Object} User context.
 */
export function createUserContext({ userId = null, team = "unknown", anonymous = true } = {}) {
  return {
    surveyId: generateId(),
    userId: anonymous ? null : userId,
    team,
    anonymous,
    createdAt: new Date().toISOString(),
  };
}

// ==========================
// 🔀 QUESTION SELECTOR (with caching)
// ==========================
let cachedQuestions = null;

/**
 * Select a random set of questions based on SURVEY_CONFIG.
 * Uses caching to avoid recomputation for the same config.
 * @param {Array} bank - Full question bank.
 * @returns {Array} Selected questions.
 */
export function getQuestions(bank) {
  const cacheKey = JSON.stringify(SURVEY_CONFIG);
  if (cachedQuestions && cachedQuestions.key === cacheKey) {
    return cachedQuestions.questions;
  }

  const scaleQ = bank.filter((q) => q.type === "scale");
  const textQ = bank.filter((q) => q.type === "text");

  const scaleCount = Math.round(SURVEY_CONFIG.TOTAL_QUESTIONS * SURVEY_CONFIG.SCALE_RATIO);
  const textCount = SURVEY_CONFIG.TOTAL_QUESTIONS - scaleCount;

  function pickRandom(arr, n) {
    if (n > arr.length) n = arr.length;
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
  }

  let selected = [];

  if (!SURVEY_CONFIG.ENABLE_BALANCED) {
    selected = [...pickRandom(scaleQ, scaleCount), ...pickRandom(textQ, textCount)];
  } else {
    // Balanced per category
    const byCategory = {};
    scaleQ.forEach((q) => {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q);
    });

    const balanced = Object.values(byCategory).map((list) => list[Math.floor(Math.random() * list.length)]);
    selected = [...pickRandom(balanced, scaleCount), ...pickRandom(textQ, textCount)];
  }

  const result = selected.slice(0, SURVEY_CONFIG.TOTAL_QUESTIONS);
  cachedQuestions = { key: cacheKey, questions: result };
  return result;
}

// ==========================
// 📊 SCORING (Enhanced)
// ==========================
/**
 * Calculate weighted average score for scale answers.
 * @param {Array} answers - Array of answer objects { type, category, value }.
 * @returns {number} Weighted score.
 */
export function calculateScore(answers) {
  let total = 0;
  let weightSum = 0;

  answers.forEach((a) => {
    if (a.type !== "scale") return;
    const weight = CATEGORY_WEIGHT[a.category] || 1;
    total += a.value * weight;
    weightSum += weight;
  });

  return weightSum === 0 ? 0 : total / weightSum;
}

// ==========================
// 🔥 RISK ANALYSIS (HR ONLY)
// ==========================
/**
 * Analyze burnout risk from answers.
 * @param {Array} answers - Array of answer objects.
 * @returns {Object} Risk analysis.
 */
export function analyzeRisk(answers) {
  const result = {
    burnoutScore: null,
    riskLevel: "low",
    flags: [],
  };

  const burnoutAnswers = answers.filter((a) => a.category === "Burnout");

  if (burnoutAnswers.length > 0) {
    const avg = burnoutAnswers.reduce((sum, a) => sum + a.value, 0) / burnoutAnswers.length;
    result.burnoutScore = avg;

    if (avg <= 2) {
      result.riskLevel = "high";
      result.flags.push("🔥 High burnout risk");
    } else if (avg <= 3) {
      result.riskLevel = "medium";
      result.flags.push("⚠️ Medium burnout risk");
    }
  }

  return result;
}

// ==========================
// 🧠 MAIN PROCESSOR
// ==========================
/**
 * Process the survey answers and return full report.
 * @param {Object} params - Process parameters.
 * @param {Array} params.answers - Survey answers.
 * @param {Object} params.userContext - User context from createUserContext.
 * @returns {Object} Processed survey result.
 */
export function processSurvey({ answers, userContext }) {
  const score = calculateScore(answers);
  const risk = analyzeRisk(answers);

  return {
    meta: userContext,
    score,
    risk,
    submittedAt: new Date().toISOString(),
  };
}

// ==================================================
// ✨ MASTERPIECE ADDITIONS (FITUR MODERN DI BAWAH INI)
// ==================================================

/**
 * Calculate statistics for a set of scale answers.
 * @param {Array} answers - Array of answer objects (scale only).
 * @returns {Object|null} Statistics including mean, median, distribution.
 */
export function calculateStatistics(answers) {
  const scaleAnswers = answers.filter((a) => a.type === "scale" && typeof a.value === "number");
  if (scaleAnswers.length === 0) return null;

  const values = scaleAnswers.map((a) => a.value).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median =
    values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
  const distribution = {};
  values.forEach((v) => {
    distribution[v] = (distribution[v] || 0) + 1;
  });

  return {
    count: values.length,
    mean: parseFloat(mean.toFixed(2)),
    median,
    min: values[0],
    max: values[values.length - 1],
    distribution,
  };
}

/**
 * Compute average score per category.
 * @param {Array} answers - Array of answer objects.
 * @returns {Object} Category scores { categoryName: score, ... }.
 */
export function getCategoryScores(answers) {
  const categoryMap = new Map();

  answers.forEach((a) => {
    if (a.type !== "scale") return;
    const cat = a.category;
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { total: 0, count: 0 });
    }
    const entry = categoryMap.get(cat);
    entry.total += a.value;
    entry.count += 1;
  });

  const scores = {};
  for (const [cat, { total, count }] of categoryMap.entries()) {
    scores[cat] = parseFloat((total / count).toFixed(2));
  }
  return scores;
}

/**
 * Generate actionable recommendations based on low category scores.
 * @param {Object} categoryScores - Output from getCategoryScores.
 * @param {number} threshold - Score below which to flag (default 3).
 * @returns {Array} List of recommendation strings.
 */
export function generateRecommendations(categoryScores, threshold = 3) {
  const recommendations = [];
  const lowCategories = Object.entries(categoryScores).filter(([_, score]) => score < threshold);

  const actionMap = {
    Burnout: "🚨 Schedule 1-on-1 wellness check-ins. Encourage time-off.",
    Workload: "⚖️ Review capacity planning and redistribute tasks.",
    Recognition: "🏆 Implement peer shout-outs and manager recognition program.",
    Management: "👤 Provide leadership training for managers.",
    eNPS: "📣 Conduct stay interviews and improve engagement initiatives.",
    Wellbeing: "⚖️ Promote flexible hours and mental health days.",
    Safety: "🛡️ Run psychological safety workshops and anonymous feedback channels.",
    Culture: "🤝 Organize team-building events and strengthen values.",
    Tools: "🛠️ Audit tooling and software licenses; gather pain points.",
    Autonomy: "🗝️ Encourage micro-decision making and reduce micro-management.",
    Alignment: "🎯 Clarify OKRs and connect individual work to company goals.",
    Confidence: "🚀 Share roadmap and financial health updates.",
    Diversity: "🌍 Review DEI policies and create inclusive hiring practices.",
    Growth: "🌱 Introduce learning budgets or mentorship programs.",
    Retention: "⚓ Stay interviews and exit interview analysis.",
    Communication: "📡 Improve cross-department communication channels.",
    Clarity: "👓 Update role descriptions and regular expectation check-ins.",
    Inclusion: "🌈 Foster ERGs and inclusive language training.",
    Satisfaction: "😊 Conduct career path discussions.",
    Collaboration: "🤝 Implement cross-functional projects and collaboration tools.",
    Purpose: "🎯 Share customer impact stories and mission alignment.",
    Support: "🙋 Encourage help-seeking culture and peer support systems.",
    Meetings: "📅 Review meeting efficiency and implement no-meeting days.",
    Compensation: "💰 Benchmark salaries and conduct pay equity audit.",
  };

  lowCategories.forEach(([cat]) => {
    const recommendation = actionMap[cat] || `🔍 Investigate low score in ${cat} category.`;
    recommendations.push(`${cat}: ${recommendation}`);
  });

  return recommendations;
}

/**
 * Validate that all required questions have answers.
 * @param {Array} answers - Provided answers.
 * @param {Array} expectedQuestions - Questions that should be answered.
 * @returns {Object} { valid: boolean, missing: Array }.
 */
export function validateAnswers(answers, expectedQuestions) {
  const answeredIds = new Set(answers.map((a) => a.questionId));
  const missing = expectedQuestions.filter((q) => !answeredIds.has(q.id));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Save a survey result to localStorage for persistence.
 * @param {string} surveyId - Unique survey ID.
 * @param {Array} answers - Answers given.
 * @param {Object} result - Processed result from processSurvey.
 */
export function saveSurveyToLocalStorage(surveyId, answers, result) {
  const data = {
    surveyId,
    answers,
    result,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(`survey_${surveyId}`, JSON.stringify(data));
}

/**
 * Load a survey from localStorage.
 * @param {string} surveyId - Survey ID to load.
 * @returns {Object|null} Stored data or null.
 */
export function loadSurveyFromLocalStorage(surveyId) {
  const raw = localStorage.getItem(`survey_${surveyId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Export survey data as JSON file download.
 * @param {Object} data - Data to export (e.g., result, answers, etc.).
 * @param {string} filename - Filename without extension.
 */
export function exportToJSON(data, filename = "survey_report") {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a form-friendly structure from selected questions.
 * @param {Array} questions - Selected questions (from getQuestions).
 * @returns {Object} Form schema with fields, validations, etc.
 */
export function createSurveyForm(questions) {
  const fields = questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    category: q.category,
    icon: q.icon,
    required: true,
    ...(q.type === "scale" && {
      min: 1,
      max: 5,
      step: 1,
    }),
  }));

  return {
    fields,
    metadata: {
      totalQuestions: questions.length,
      scaleCount: questions.filter((q) => q.type === "scale").length,
      textCount: questions.filter((q) => q.type === "text").length,
    },
  };
}

/**
 * Simple event emitter for survey lifecycle hooks.
 * Can be used to notify external systems when survey is completed.
 */
export class SurveyEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(data));
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }
}

// Optional: Pre-create a global emitter instance
export const surveyEmitter = new SurveyEventEmitter();

/**
 * Process survey and also emit event, optionally save to localStorage.
 * @param {Object} params - Same as processSurvey plus options.
 * @param {Array} params.answers - Answers.
 * @param {Object} params.userContext - User context.
 * @param {boolean} params.saveToLocal - If true, save to localStorage.
 * @param {Array} params.expectedQuestions - For validation.
 * @returns {Object} Processed result.
 */
export function processSurveyWithEnhancements({ answers, userContext, saveToLocal = false, expectedQuestions = null }) {
  if (expectedQuestions) {
    const validation = validateAnswers(answers, expectedQuestions);
    if (!validation.valid) {
      throw new Error(`Missing answers: ${validation.missing.map((q) => q.id).join(", ")}`);
    }
  }

  const result = processSurvey({ answers, userContext });
  const categoryScores = getCategoryScores(answers);
  const recommendations = generateRecommendations(categoryScores);
  const statistics = calculateStatistics(answers);

  const enhancedResult = {
    ...result,
    categoryScores,
    recommendations,
    statistics,
  };

  if (saveToLocal) {
    saveSurveyToLocalStorage(userContext.surveyId, answers, enhancedResult);
  }

  surveyEmitter.emit("surveyCompleted", enhancedResult);
  return enhancedResult;
}
