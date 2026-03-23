# ⚡ AttritionIQ
### Employee Attrition Intelligence Platform
**by Alfin Maulana Yudistira · Pulse Digital**

---

## 🔗 Live Demo
[attritioniq.netlify.app](https://attritioniq.netlify.app)

## 📋 About
AttritionIQ is a universal, AI-powered SaaS platform for predicting and preventing employee attrition. Upload your own HR data and get instant analytics — works for any company, any industry.

**Built to prove:** Google Advanced Data Analytics Professional Certificate skills in action.

---

## 🧩 Modules (9 Total)
| # | Module | Status |
|---|--------|--------|
| M1 | Attrition Dashboard | ✅ Live |
| M2 | Predictive Risk Scorer | 🔄 In Progress |
| M3 | Salary Benchmarking Studio | 🔄 In Progress |
| M4 | Department Health Monitor | 🔄 In Progress |
| M5 | Exit Interview Analyzer | 🔄 In Progress |
| M6 | Retention ROI Calculator | 🔄 In Progress |
| M7 | Shift & Fatigue Radar | 🔄 In Progress |
| M8 | Internal Talent Matchmaker | 🔄 In Progress |
| M9 | Micro-Pulse Survey Engine | 🔄 In Progress |

---

## 🛠 Tech Stack
- **Framework:** React 18 + Vite 5
- **Styling:** Inline CSS with design system tokens
- **Charts:** Custom SVG (D3-inspired, zero dependencies)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Data:** CSV upload + Papa Parse
- **Deploy:** Netlify (auto-deploy from GitHub)
- **Fonts:** Playfair Display + DM Sans (Google Fonts)

---

## 🚀 Deploy Instructions

### Local Dev
```bash
npm install
npm run dev
```

### Deploy to Netlify
1. Push this repo to GitHub
2. Go to netlify.com → Add new site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

---

## 📁 Project Structure
```
attritioniq/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          ← Main application
│   ├── main.jsx         ← Entry point
│   └── index.css        ← Global styles
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml         ← SPA routing fix
└── README.md
```

---

## 📊 Data Format
Upload a CSV with these columns:
```
EmployeeID, FirstName, LastName, Department, MonthlySalary,
OvertimeStatus, JobSatisfaction, AttritionStatus, YearsAtCompany, Age
```
Download the template inside the app.

---

*Project 3 of 14 · HR Analytics Series · Pulse Digital Portfolio*
