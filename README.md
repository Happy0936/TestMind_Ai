# TestMind AI — Automated Software Quality Engineering & Testing Suite

TestMind AI is a lightweight, zero-dependency software testing suite designed to accelerate shift-left quality assurance. Built with modern web technologies and powered by the Google Gemini Flash API, TestMind AI automates test case synthesis, static defect identification, accessibility audits, visual regression diffing, API contract validation, and risk-weighted CI/CD test scheduling.

---

### Key Technical Highlights
- **Direct-to-Model Execution:** Zero backend middleware dependencies. The browser handles validation, prompt construction, and payload dispatch directly via REST endpoints.
- **Strict Schema Enforcement:** Enforces deterministic JSON responses across all analysis modes, parsed via regex fallback and structured extractors.
- **Ephemeral Session Security:** API credentials persist exclusively inside `sessionStorage`, surviving browser reloads while auto-terminating upon tab closure to eliminate credential leakage.
- **Custom Design System:** Built using custom CSS variables (dark-mode palette, tokenized borders, and monospace font pairings) with zero third-party UI framework overhead.

---

### Core Testing Modules

#### 1. Code Analyzer & Test Synthesizer
Performs multi-language static analysis and test case generation across Python and JavaScript codebases.
- **Unit & Integration Test Generation:** Synthesizes executable assertion blocks and boundary checks.
- **Defect & Vulnerability Identification:** Flags logic flaws, null pointer exceptions, unhandled race conditions, and memory leaks with exact line references.
- **Automated Patch Synthesis:** Generates side-by-side `- / +` unified diffs demonstrating remediation logic.
- **Control Flow Auditing:** Detects state machine inconsistencies and unexpected user-journey branches.

#### 2. UI & Accessibility Auditor
Automates front-end inspection for web markup and production endpoints.
- **WCAG 2.1 Compliance Check:** Detects missing ARIA landmarks, non-compliant color contrast ratios, missing alternative text, and improper keyboard focus states.
- **Design Token Consistency:** Flags typography hierarchy mismatches, padding/margin drift, and conflicting border-radius tokens.
- **Responsive Layout Inspection:** Identifies fixed-width containers, missing viewport metas, and mobile breakpoint collision points.

#### 3. Visual Regression Diff Engine
Analyzes baseline vs. modified component specs to identify unintended layout shifts before production deployments.
- **Variance Extraction:** Measures property shifts (font sizes, paddings, hex values, box-shadows).
- **DOM Mutation Tracking:** Flags added, removed, or restyled DOM nodes.
- **Risk Assessment:** Computes change severity scores and highlights breaking visual regressions.

#### 4. API Contract & Security Tester
Synthesizes end-to-end integration and penetration test scenarios from raw endpoint definitions.
- **OWASP Vulnerability Profiling:** Generates exploits for SQL Injection, XSS, Broken Object-Level Authorization (BOLA/IDOR), and Mass Assignment.
- **Boundary & Fuzzing Cases:** Generates malformed payloads, payload length extremes, and Unicode test inputs.
- **Automated Script Generation:** Compiles findings into fully runnable, standalone Python `requests` test scripts.

#### 5. Smart Test Prioritizer
Ranks test execution queues to optimize CI/CD pipeline velocity, modeled after predictive test selection architectures.
- **Multi-Factor Risk Scoring:** Weights execution priority using blast radius, user-facing surface area, and code churn history.
- **Staged Pipeline Scheduling:** Generates phased execution plans (Stage 1: Smoke < 3 min, Stage 2: Critical Path < 15 min, Stage 3: Full Extended Regression).
- **Parallel Group Allocation:** Identifies decoupled test suites that can execute concurrently across worker nodes.

---

##  Project Structure

```
testmind-ai/
├── index.html        # Multi-panel interface and layout structure
├── style.css         # Custom dark theme, typography tokens, and responsive grid
├── app.js            # Router, state persistence, API orchestration, and JSON parsers
└── README.md         # Architecture documentation and deployment guide
```
### Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Core** | HTML5, Vanilla JavaScript (ES6+), CSS3 Grid / Flexbox |
| **Typography & Assets** | IBM Plex Mono, Sora |
| **Model & Engine** | Google Gemini REST API (`gemini-3.6-flash`) |
| **Security & State** | Browser `sessionStorage`, DOM Text Sanitization |
| **Hosting & Deployment** | Vercel Static Deployment / Netlify / GitHub Pages |

---

## Author

Happy

M.Tech Student at NIT Silchar

