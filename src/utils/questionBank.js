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
// 🆔 UTIL: Generate ID
// ==========================
export function generateId(prefix = "svy") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ==========================
// 👤 USER CONTEXT (AUTO)
// ==========================
export function createUserContext({ userId = null, team = null, anonymous = true } = {}) {
  return {
    surveyId: generateId(),
    userId: anonymous ? null : userId,
    team: team || "unknown",
    anonymous,
    createdAt: new Date().toISOString()
  };
}

// ==========================
// 🔀 QUESTION SELECTOR
// ==========================
export function getQuestions(bank) {
  const scaleQ = bank.filter(q => q.type === "scale");
  const textQ  = bank.filter(q => q.type === "text");

  const scaleCount = Math.round(SURVEY_CONFIG.TOTAL_QUESTIONS * SURVEY_CONFIG.SCALE_RATIO);
  const textCount  = SURVEY_CONFIG.TOTAL_QUESTIONS - scaleCount;

  function pickRandom(arr, n) {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
  }

  if (!SURVEY_CONFIG.ENABLE_BALANCED) {
    return [
      ...pickRandom(scaleQ, scaleCount),
      ...pickRandom(textQ, textCount)
    ];
  }

  // Balanced per category
  const byCategory = {};
  scaleQ.forEach(q => {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  });

  const balanced = Object.values(byCategory)
    .map(list => list[Math.floor(Math.random() * list.length)]);

  return [
    ...pickRandom(balanced, scaleCount),
    ...pickRandom(textQ, textCount)
  ].slice(0, SURVEY_CONFIG.TOTAL_QUESTIONS);
}

// ==========================
// 📊 SCORING
// ==========================
export function calculateScore(answers) {
  let total = 0;
  let weightSum = 0;

  answers.forEach(a => {
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
export function analyzeRisk(answers) {
  const result = {
    burnoutScore: null,
    riskLevel: "low",
    flags: []
  };

  const burnoutAnswers = answers.filter(a => a.category === "Burnout");

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
export function processSurvey({ answers, userContext }) {
  const score = calculateScore(answers);
  const risk  = analyzeRisk(answers);

  return {
    meta: userContext,
    score,
    risk,
    submittedAt: new Date().toISOString()
  };
}
