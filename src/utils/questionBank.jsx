import React, { useState } from "react";

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
  { id: "q40", text: "Is there anything else you would like to share?",                 type: "text",  category: "General",       icon: "🗨️" },
  { id: "q41", text: "How effectively is AI/tools being integrated in your daily workflow?", type: "scale", category: "Innovation", icon: "🤖" },
  { id: "q42", text: "Do you feel supported in hybrid/remote work arrangements?", type: "scale", category: "Wellbeing", icon: "🏠" },
  { id: "q43", text: "How sustainable do you feel your current work pace is long-term?", type: "scale", category: "Burnout", icon: "🌱" },
  { id: "q44", text: "Does the company demonstrate genuine commitment to environmental/social impact?", type: "scale", category: "Purpose", icon: "🌍" },
  { id: "q45", text: "How comfortable are you with the pace of technological change here?", type: "scale", category: "Growth", icon: "⚡" },
  { id: "q46", text: "Do you have access to mental health resources when needed?", type: "scale", category: "Wellbeing", icon: "🧠" },
  { id: "q47", text: "How clear is the company's vision for the next 2-3 years?", type: "scale", category: "Confidence", icon: "🔮" },
  { id: "q48", text: "What frustrates you most about our current tools/processes?", type: "text", category: "Tools", icon: "🔧" },
  { id: "q49", text: "Have you received any training on new technologies this quarter?", type: "scale", category: "Growth", icon: "📚" },
  { id: "q50", text: "Do you feel your voice is heard in company-wide decisions?", type: "scale", category: "Inclusion", icon: "🗣️" },
  { id: "q51", text: "How would you rate the quality of cross-timezone collaboration?", type: "scale", category: "Collaboration", icon: "🌐" },
  { id: "q52", text: "What's one process we should automate with AI next?", type: "text", category: "Innovation", icon: "💡" },
  { id: "q53", text: "Do you feel the company supports your personal development goals?", type: "scale", category: "Career", icon: "🎯" },
  { id: "q54", text: "How inclusive do you find our internal communication style?", type: "scale", category: "Culture", icon: "🌈" },
  { id: "q55", text: "Anything else on your mind that we haven't covered?", type: "text", category: "General", icon: "🧩" }
];

export const CATEGORY_WEIGHT = {
  Burnout: 2.0,
  Workload: 1.5,
  Wellbeing: 2.2,
  eNPS: 1.8,
  Management: 1.5,
  Culture: 1.2,
  General: 1.0,
  Innovation: 1.6,
  Purpose: 1.4,
};

export const SURVEY_CONFIG = {
  TOTAL_QUESTIONS: 8,
  SCALE_RATIO: 0.8,
  ENABLE_BALANCED: true
};

export function generateId(prefix = "svy") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createUserContext({ userId = null, team = "unknown", anonymous = true } = {}) {
  return {
    surveyId: generateId(),
    userId: anonymous ? null : userId,
    team,
    anonymous,
    createdAt: new Date().toISOString(),
  };
}

let cachedQuestions = null;

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

// ==========================
// 🛠️ VALIDATION & STORAGE
// ==========================
export function validateAnswers(answers, expectedQuestions) {
  const answeredIds = new Set(answers.map((a) => a.questionId));
  const missing = expectedQuestions.filter((q) => !answeredIds.has(q.id));
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function saveSurveyToLocalStorage(surveyId, answers, result) {
  const data = {
    surveyId,
    answers,
    result,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(`survey_${surveyId}`, JSON.stringify(data));
}

export function loadSurveyFromLocalStorage(surveyId) {
  const raw = localStorage.getItem(`survey_${surveyId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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

// ==========================
// 📄 FORM BUILDER & EVENTS
// ==========================
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

export const surveyEmitter = new SurveyEventEmitter();

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

// ==========================
// 💾 UNIVERSAL STORAGE ADAPTER
// ==========================
export class StorageAdapter {
  constructor(type = "local") {
    this.type = type;
    this.isBrowser = typeof window !== "undefined";
    if (this.type === "memory") this._memory = new Map();
  }

  set(key, value) {
    const data = JSON.stringify(value);
    if (this.type === "local" && this.isBrowser) localStorage.setItem(key, data);
    else if (this.type === "session" && this.isBrowser) sessionStorage.setItem(key, data);
    else if (this.type === "memory") this._memory.set(key, value);
  }

  get(key) {
    if (this.type === "local" && this.isBrowser) {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    if (this.type === "session" && this.isBrowser) {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    if (this.type === "memory") return this._memory.get(key);
    return null;
  }
}

export const storage = new StorageAdapter("local");

// ==========================
// 📝 SENTIMENT ANALYZER
// ==========================
export function analyzeTextSentiment(answers) {
  const sentimentMap = {
    positive: ["great", "love", "awesome", "excellent", "amazing", "happy", "good", "fantastic", "proud"],
    negative: ["frustrated", "bad", "poor", "terrible", "overwhelmed", "hate", "annoying", "stress", "burnout"]
  };

  return answers
    .filter((a) => a.type === "text" && a.value)
    .map((a) => {
      const text = a.value.toLowerCase();
      let score = 0;
      let keywords = [];
      sentimentMap.positive.forEach((w) => { if (text.includes(w)) { score += 1; keywords.push(w); } });
      sentimentMap.negative.forEach((w) => { if (text.includes(w)) { score -= 1; keywords.push(w); } });

      return {
        questionId: a.questionId,
        text: a.value,
        sentiment: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
        score,
        keywords: [...new Set(keywords)]
      };
    });
}

// ==========================
// 🧠 SMART ADAPTIVE SELECTOR
// ==========================
export function getAdaptiveQuestions(bank, previousSurveys = [], maxHistory = 3) {
  const lastSurveys = previousSurveys.slice(-maxHistory);
  const weakCategories = new Set();

  lastSurveys.forEach((survey) => {
    const scores = getCategoryScores(survey.answers || survey);
    Object.entries(scores).forEach(([cat, score]) => {
      if (score < 3.2) weakCategories.add(cat);
    });
  });

  let selected = [];
  const scaleQ = bank.filter((q) => q.type === "scale");

  if (weakCategories.size > 0) {
    const weakQs = scaleQ.filter((q) => weakCategories.has(q.category));
    // custom inline pickRandom to avoid outer scope dependency
    const rand = [...weakQs].sort(() => 0.5 - Math.random()).slice(0, Math.min(3, weakCategories.size));
    selected.push(...rand);
  }

  const remaining = SURVEY_CONFIG.TOTAL_QUESTIONS - selected.length;
  const balancedRest = getQuestions(bank).slice(0, remaining);

  selected = [...selected, ...balancedRest].slice(0, SURVEY_CONFIG.TOTAL_QUESTIONS);
  return [...new Set(selected)];
}

// ==========================
// 🚀 SURVEY ENGINE CLASS
// ==========================
export class SurveyEngine {
  constructor(configOverrides = {}) {
    this.config = { ...SURVEY_CONFIG, ...configOverrides, ENABLE_ADAPTIVE: true };
    this.storage = storage;
    this.emitter = surveyEmitter;
  }

  async startSurvey(userContext) {
    const previous = this.storage.get(`user_history_${userContext.userId || "anonymous"}`) || [];
    const questions = this.config.ENABLE_ADAPTIVE && previous.length > 0
      ? getAdaptiveQuestions(QUESTION_BANK, previous)
      : getQuestions(QUESTION_BANK);

    return {
      questions,
      formSchema: createSurveyForm(questions),
      userContext
    };
  }

  async submit(answers, userContext, save = true) {
    const enhanced = processSurveyWithEnhancements({
      answers,
      userContext,
      saveToLocal: false,
      expectedQuestions: []
    });

    const textSentiment = analyzeTextSentiment(answers);
    const previousSurveys = this.storage.get(`user_history_${userContext.userId || "anonymous"}`) || [];

    const finalResult = {
      ...enhanced,
      textSentiment,
      trend: previousSurveys.length > 1 ? this._calculateTrend(enhanced.score, previousSurveys) : null
    };

    if (save) {
      this.storage.set(`survey_${userContext.surveyId}`, finalResult);
      const historyKey = `user_history_${userContext.userId || "anonymous"}`;
      const history = this.storage.get(historyKey) || [];
      history.push({ surveyId: userContext.surveyId, score: enhanced.score, submittedAt: finalResult.submittedAt });
      this.storage.set(historyKey, history.slice(-10));
    }

    this.emitter.emit("surveyCompleted", finalResult);
    return finalResult;
  }

  _calculateTrend(currentScore, previous) {
    const lastScore = previous[previous.length - 1].score;
    const change = currentScore - lastScore;
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      change: parseFloat(change.toFixed(2)),
      lastScore
    };
  }

  exportReport(surveyId, format = "json") {
    const data = this.storage.get(`survey_${surveyId}`);
    if (!data) throw new Error("Survey not found");
    if (format === "csv") {
      const headers = ["questionId", "category", "type", "answer", "value"];
      const rows = data.answers.map((a) => [a.questionId, a.category, a.type, a.text || a.value, a.value || ""]);
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `survey_${surveyId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } else {
      exportToJSON(data, `survey_report_${surveyId}`);
    }
  }
}

export const surveyEngine = new SurveyEngine({ TOTAL_QUESTIONS: 8 });

// ==========================
// 📈 CATEGORY TREND
// ==========================
export function calculateCategoryTrend(current, previous) {
  const trend = {};

  Object.keys(current).forEach((cat) => {
    const prev = previous[cat] ?? current[cat];
    const diff = current[cat] - prev;

    trend[cat] = {
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable",
      change: parseFloat(diff.toFixed(2)),
    };
  });

  return trend;
}

// ==========================
// 🔮 SMART INSIGHT
// ==========================
export function generateInsights(scores, risk) {
  const insights = [];

  if (scores.Burnout < 3 && scores.Workload < 3) {
    insights.push("⚠️ Employees likely experiencing overload and fatigue.");
  }

  if (scores.Recognition < 3 && scores.Culture < 3) {
    insights.push("💡 Low recognition may be affecting morale.");
  }

  if (scores.Management < 3) {
    insights.push("👤 Leadership support may need improvement.");
  }

  if (risk.riskLevel === "high") {
    insights.push("🔥 High burnout risk detected.");
  }

  if (scores.Growth > 4 && scores.Satisfaction > 4) {
    insights.push("🚀 Strong growth and satisfaction correlation.");
  }

  return insights;
}

// ==========================
// 📊 BENCHMARK
// ==========================
export function calculateBenchmark(teamScores, globalScores) {
  const result = {};

  Object.keys(teamScores).forEach((cat) => {
    const global = globalScores[cat] ?? teamScores[cat];
    result[cat] = parseFloat((teamScores[cat] - global).toFixed(2));
  });

  return result;
}

// ==========================
// 🚨 ALERT & CHURN
// ==========================
export function generateAlerts(result) {
  const alerts = [];

  if (result.risk.riskLevel === "high") {
    alerts.push("🔥 Burnout risk critical");
  }

  if (result.categoryScores.Workload < 2.5) {
    alerts.push("⚖️ Workload imbalance");
  }

  if (result.categoryScores.Wellbeing < 3) {
    alerts.push("🧠 Wellbeing declining");
  }

  return alerts;
}

export function predictChurn(categoryScores) {
  let riskScore = 0;
  const reasons = [];

  if ((categoryScores.Burnout ?? 5) < 3) {
    riskScore += 2;
    reasons.push("High burnout");
  }

  if ((categoryScores.Satisfaction ?? 5) < 3) {
    riskScore += 2;
    reasons.push("Low satisfaction");
  }

  if ((categoryScores.eNPS ?? 5) < 3) {
    riskScore += 1.5;
    reasons.push("Low eNPS");
  }

  if ((categoryScores.Retention ?? 5) < 3) {
    riskScore += 2;
    reasons.push("Low retention intent");
  }

  if ((categoryScores.Growth ?? 5) < 3) {
    riskScore += 1;
    reasons.push("Lack of growth");
  }

  let risk = "low";

  if (riskScore >= 5) risk = "high";
  else if (riskScore >= 3) risk = "medium";

  return {
    score: parseFloat(riskScore.toFixed(2)),
    risk,
    reasons,
  };
}

// ==========================
// 🗄️ SAAS STORAGE
// ==========================
export class SaaSStorage {
  constructor(storageAdapter) {
    this.storage = storageAdapter;
  }

  saveSurvey(companyId, data) {
    const key = `company_${companyId}_surveys`;
    const existing = this.storage.get(key) || [];
    existing.push(data);
    this.storage.set(key, existing);
  }

  getCompanySurveys(companyId) {
    return this.storage.get(`company_${companyId}_surveys`) || [];
  }

  getTeamSurveys(companyId, teamId) {
    const all = this.getCompanySurveys(companyId);
    return all.filter((s) => s.meta.team === teamId);
  }
}

// ==========================
// 📊 AGGREGATION & INSIGHTS
// ==========================
export function aggregateScores(surveys) {
  if (!surveys.length) return {};

  const totals = {};
  const counts = {};

  surveys.forEach((s) => {
    Object.entries(s.categoryScores || {}).forEach(([cat, val]) => {
      totals[cat] = (totals[cat] || 0) + val;
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });

  const result = {};
  Object.keys(totals).forEach((cat) => {
    result[cat] = parseFloat((totals[cat] / counts[cat]).toFixed(2));
  });

  return result;
}

export function getCompanyInsights(saasStorage, companyId) {
  const surveys = saasStorage.getCompanySurveys(companyId);
  const companyScore = aggregateScores(surveys);
  const teams = {};

  surveys.forEach((s) => {
    const team = s.meta.team || "unknown";
    if (!teams[team]) teams[team] = [];
    teams[team].push(s);
  });

  const teamInsights = {};

  Object.entries(teams).forEach(([team, data]) => {
    teamInsights[team] = aggregateScores(data);
  });

  return {
    companyScore,
    teamInsights,
  };
}

export function enrichResult(result, globalScores = null) {
  const churn = predictChurn(result.categoryScores);
  const insights = generateInsights(result.categoryScores, result.risk);
  const alerts = generateAlerts(result);

  const benchmark = globalScores
    ? calculateBenchmark(result.categoryScores, globalScores)
    : null;

  return {
    ...result,
    churn,
    insights,
    alerts,
    benchmark,
  };
}

// ==========================
// ⚛️ REACT HOOKS & COMPONENTS
// ==========================
export function useSurveyEngine(engine) {
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function start(userContext) {
    setLoading(true);
    const res = await engine.startSurvey(userContext);
    setQuestions(res.questions);
    setLoading(false);
  }

  async function submit(answers, userContext) {
    setLoading(true);
    const res = await engine.submit(answers, userContext);
    setResult(res);
    setLoading(false);
  }

  return { questions, result, loading, start, submit };
}

export function SurveyDashboard({ result }) {
  if (!result) return <div>No data</div>;

  return (
    <div>
      <h2>Score: {result.score}</h2>
      <h3>Risk: {result.risk.riskLevel}</h3>

      {Object.entries(result.categoryScores).map(([cat, val]) => (
        <div key={cat}>
          {cat}: {val}
        </div>
      ))}

      <h3>Recommendations</h3>
      <ul>
        {result.recommendations?.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function calculateTrueENPS(answers) {
  const enpsAnswers = answers.filter(a => a.category === "eNPS" && a.type === "scale");
  if (enpsAnswers.length === 0) return null;

  let promoters = 0;
  let detractors = 0;

  enpsAnswers.forEach(a => {
    if (a.value >= 9) promoters++;
    else if (a.value <= 6) detractors++;
  });

  const total = enpsAnswers.length;
  const enpsScore = Math.round(((promoters / total) - (detractors / total)) * 100);

  return {
    score: enpsScore, // Range: -100 to 100
    promoters,
    passives: total - promoters - detractors,
    detractors,
    status: enpsScore > 30 ? "Excellent" : enpsScore > 0 ? "Good" : "Needs Improvement"
  };
}

export function detectCriticalRisks(answers) {
  const criticalKeywords = ["resign", "quit", "toxic", "harassment", "bullying", "illegal", "discriminate", "unsafe", "leave"];
  const threats = [];

  answers.forEach(a => {
    if (a.type === "text" && a.value) {
      const text = a.value.toLowerCase();
      const found = criticalKeywords.filter(kw => text.includes(kw));
      if (found.length > 0) {
        threats.push({
          questionId: a.questionId,
          flags: found,
          snippet: text.length > 60 ? text.substring(0, 60) + "..." : text
        });
      }
    }
  });

  return {
    hasCriticalRisk: threats.length > 0,
    threats
  };
}
