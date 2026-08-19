// ══════════════════════════════════════════════════
// 1. API KEY PERSISTENCE (SESSION-ONLY)
// ══════════════════════════════════════════════════
const apiKeyInput = document.getElementById('apiKey');
const apiWrap = document.getElementById('apiWrap');
const keyBadge = document.getElementById('keyStatusBadge');
const keyText = document.getElementById('keyStatusText');
const clearKeyBtn = document.getElementById('clearKeyBtn');

function updateKeyStatus(key) {
  if (key && key.length > 20) {
    keyBadge.className = 'badge connected';
    keyText.textContent = 'Key Ready';
    apiWrap.classList.add('is-valid');
    clearKeyBtn.style.display = 'block';
  } else {
    keyBadge.className = 'badge missing';
    keyText.textContent = 'No Key';
    apiWrap.classList.remove('is-valid');
    clearKeyBtn.style.display = 'none';
  }
}

// Auto-load saved key on refresh (survives reload, wiped on tab close)
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = sessionStorage.getItem('gemini_api_key') || '';
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }
  updateKeyStatus(savedKey);
});

// Update state on input
apiKeyInput.addEventListener('input', (e) => {
  const val = e.target.value.trim();
  sessionStorage.setItem('gemini_api_key', val);
  updateKeyStatus(val);
});

// Clear key button
clearKeyBtn.addEventListener('click', () => {
  apiKeyInput.value = '';
  sessionStorage.removeItem('gemini_api_key');
  updateKeyStatus('');
});

// ══════════════════════════════════════════════════
// 2. TAB NAVIGATION & LANGUAGE TOGGLES
// ══════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

let currentLang = 'python';
function setLang(lang, el) {
  currentLang = lang;
  el.parentElement.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

// ══════════════════════════════════════════════════
// 3. GEMINI API CLIENT & UTILITIES
// ══════════════════════════════════════════════════
async function callGemini(prompt) {
  const key = apiKeyInput.value.trim();
  if (!key) throw new Error('API key missing. Paste your key in the header to proceed.');
  
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
    })
  });

  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.error?.message || `API error (${res.status})`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Received an empty response from model.');
  return text;
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Malformed JSON received from model.');
  }
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function showLoading(el, msg) {
  el.innerHTML = `
    <div class="streaming">
      <div class="dots"><span></span><span></span><span></span></div>
      <span>${esc(msg)}</span>
    </div>`;
}

function showError(el, err) {
  el.innerHTML = `
    <div class="card" style="border-color: var(--red)">
      <span class="sev critical">EXECUTION ERROR</span>
      <h4>Request Failed</h4>
      <p class="desc">${esc(err.message)}</p>
    </div>`;
}

// ══════════════════════════════════════════════════
// 4. SAMPLE DATASETS
// ══════════════════════════════════════════════════
const SAMPLES = {
python: `class ShoppingCart:
    def __init__(self):
        self.items = []
        self.discount_code = None

    def add_item(self, name, price, quantity):
        self.items.append({"name": name, "price": price, "quantity": quantity})

    def remove_item(self, name):
        for item in self.items:
            if item["name"] == name:
                self.items.remove(item)

    def apply_discount(self, code):
        discounts = {"SAVE10": 10, "SAVE20": 20, "HALF": 50}
        self.discount_code = code
        return discounts[code]

    def calculate_total(self):
        total = 0
        for item in self.items:
            total += item["price"] * item["quantity"]
        if self.discount_code:
            discount = self.apply_discount(self.discount_code)
            total = total - (total * discount / 100)
        return total

    def checkout(self, payment_method, amount):
        total = self.calculate_total()
        if amount >= total:
            self.items = []
            return {"status": "success", "change": amount - total}
        return {"status": "failed"}`,

javascript: `class UserAuth {
  constructor() {
    this.users = [];
    this.currentUser = null;
    this.loginAttempts = {};
  }

  register(email, password, name) {
    const user = {
      id: this.users.length + 1,
      email: email,
      password: password,
      name: name,
      createdAt: Date.now()
    };
    this.users.push(user);
    return user;
  }

  login(email, password) {
    const user = this.users.find(u => u.email == email);
    if (!user) return { error: "User not found" };
    if (this.loginAttempts[email] >= 3) {
      return { error: "Account locked" };
    }
    if (user.password != password) {
      this.loginAttempts[email] = (this.loginAttempts[email] || 0) + 1;
      return { error: "Wrong password" };
    }
    this.currentUser = user;
    return { success: true, user: user };
  }

  resetPassword(email, newPassword) {
    const user = this.users.find(u => u.email === email);
    user.password = newPassword;
    return { success: true };
  }

  getUserProfile(userId) {
    const user = this.users.find(u => u.id === userId);
    return { id: user.id, email: user.email, password: user.password, name: user.name };
  }
}`,

uiHtml: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; margin: 0; }
    .nav { background: #333; padding: 15px; display: flex; justify-content: space-between; }
    .nav a { color: white; text-decoration: none; font-size: 14px; }
    .hero { background: #f0f0f0; padding: 60px 20px; text-align: center; }
    .hero h1 { font-size: 36px; color: #333; margin-bottom: 10px; }
    .hero p { color: #666; font-size: 16px; }
    .btn { background: #007bff; color: white; padding: 12px 24px; border: none;
           border-radius: 4px; font-size: 14px; cursor: pointer; margin-top: 20px; }
    .cards { display: flex; gap: 20px; padding: 40px; flex-wrap: wrap; }
    .card { flex: 1; min-width: 250px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
    .card img { width: 100%; height: 200px; object-fit: cover; }
    .card h3 { margin: 12px 0 8px; font-size: 18px; }
    .card p { color: #999; font-size: 13px; line-height: 1.5; }
    .footer { background: #222; color: #aaa; padding: 30px; text-align: center; font-size: 12px; }
    .form { max-width: 400px; margin: 40px auto; }
    .form input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .form label { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="#">Logo</a>
    <div><a href="#">Home</a> <a href="#">About</a> <a href="#">Contact</a></div>
  </nav>
  <section class="hero">
    <h1>Welcome to Our Platform</h1>
    <p>The best solution for your needs</p>
    <button class="btn">Get Started</button>
  </section>
  <div class="cards">
    <div class="card"><img src="placeholder.jpg" alt=""><h3>Feature One</h3><p>Description of feature one goes here with some details.</p></div>
    <div class="card"><img src="placeholder.jpg"><h3>Feature Two</h3><p>Description of feature two goes here.</p></div>
    <div class="card"><img src="placeholder.jpg" alt=""><h3>Feature Three</h3><p>Short desc.</p></div>
  </div>
  <div class="form">
    <label>Email</label>
    <input type="text" placeholder="Enter email">
    <label>Password</label>
    <input type="text" placeholder="Enter password">
    <button class="btn" style="width:100%">Login</button>
  </div>
  <footer class="footer">© 2024 Company. All rights reserved.</footer>
</body>
</html>`,

vrBefore: `<!-- Baseline Component Spec -->
<style>
  .login-container { max-width: 400px; margin: 60px auto; padding: 32px;
    background: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
  .login-container h2 { font-size: 24px; color: #1a1a2e; margin-bottom: 24px; text-align: center; }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 14px; color: #444; margin-bottom: 6px; }
  .form-group input { width: 100%; padding: 12px 16px; border: 1px solid #ddd;
    border-radius: 8px; font-size: 14px; }
  .btn-login { width: 100%; padding: 14px; background: #4A90D9; color: white;
    border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
</style>
<div class="login-container">
  <h2>Welcome Back</h2>
  <div class="form-group"><label>Email Address</label><input type="email" placeholder="user@domain.com"></div>
  <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••"></div>
  <button class="btn-login">Sign In</button>
</div>`,

vrAfter: `<!-- Modified Component Spec -->
<style>
  .login-container { max-width: 380px; margin: 40px auto; padding: 28px;
    background: #f8f8f8; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .login-container h2 { font-size: 20px; color: #333333; margin-bottom: 16px; text-align: left; }
  .form-group { margin-bottom: 12px; }
  .form-group label { display: block; font-size: 13px; color: #666; margin-bottom: 4px; }
  .form-group input { width: 100%; padding: 10px 12px; border: 2px solid #bbb;
    border-radius: 4px; font-size: 13px; }
  .btn-login { width: 100%; padding: 12px; background: #e74c3c; color: white;
    border: none; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
<div class="login-container">
  <h2>Login</h2>
  <div class="form-group"><label>Email</label><input type="text" placeholder="Email"></div>
  <div class="form-group"><label>Password</label><input type="text" placeholder="Password"></div>
  <button class="btn-login">LOG IN</button>
</div>`,

apiSample: {
  url: 'https://api.example.com/v1/users',
  method: 'POST',
  body: `{\n  "username": "string (3-30 chars, alphanumeric)",\n  "email": "string (valid email format)",\n  "password": "string (min 8 chars, 1 uppercase, 1 numeric)",\n  "age": "number (minimum 18)",\n  "role": "string (enum: user, admin, moderator)"\n}`,
  headers: `{\n  "Authorization": "Bearer <jwt_token>",\n  "Content-Type": "application/json",\n  "X-Request-ID": "uuid-v4"\n}`,
  context: `Business Rules:\n- Email and username must be unique.\n- Only administrators can assign elevated role scopes.\n- Rate limit: 10 requests per client IP per hour.\n- Password must be hashed server-side with bcrypt.\n- Expected status on success: 201 Created.`
},

priSample: `1. User Registration (email + OAuth)
2. Login/Authentication (JWT with refresh tokens)
3. Password Reset Flow (timed token verification)
4. Product Search (Elasticsearch with filter sets)
5. Shopping Cart (state persistence across sessions)
6. Checkout & Stripe Payment Integration
7. Order History & Fulfillment Status Webhooks
8. Admin Analytics Dashboard & User Scopes
9. Push Notification Dispatch Service
10. Image Upload Pipeline with CDN Invalidation`
};

function loadCodeSample() { document.getElementById('codeInput').value = SAMPLES[currentLang]; }
function loadUISample() { document.getElementById('uiHtml').value = SAMPLES.uiHtml; document.getElementById('uiUrl').value = ''; }
function loadVRSample() { document.getElementById('vrBefore').value = SAMPLES.vrBefore; document.getElementById('vrAfter').value = SAMPLES.vrAfter; }
function loadAPISample() {
  const s = SAMPLES.apiSample;
  document.getElementById('apiUrl').value = s.url;
  document.getElementById('apiMethod').value = s.method;
  document.getElementById('apiBody').value = s.body;
  document.getElementById('apiHeaders').value = s.headers;
  document.getElementById('apiContext').value = s.context;
}
function loadPriSample() { document.getElementById('priInput').value = SAMPLES.priSample; }

// ══════════════════════════════════════════════════
// 5. MODULE EXECUTION HANDLERS
// ══════════════════════════════════════════════════

// Module 1: Code Analyzer
async function runCodeAnalysis() {
  const code = document.getElementById('codeInput').value.trim();
  const mode = document.getElementById('codeMode').value;
  const el = document.getElementById('codeResults');
  if (!code) return alert('Source code input cannot be empty.');
  
  showLoading(el, 'Executing code inspection and test generation…');
  try {
    const prompt = `You are an automated software testing engine. Analyze this ${currentLang} source code.
RESPOND STRICTLY WITH VALID JSON. No markdown fences, no conversational prose.

${mode === 'full' || mode === 'tests' ? `"test_cases": [{"name":"str","description":"str","type":"unit|integration|edge_case|boundary|negative","code":"runnable test code","severity":"info"}],` : ''}
${mode === 'full' || mode === 'bugs' ? `"bugs": [{"title":"str","description":"str","severity":"critical|warning|info","line_hint":"str","fix_suggestion":"str"}],` : ''}
${mode === 'full' || mode === 'bugs' ? `"fixes": [{"title":"str","description":"str","original_code":"str","fixed_code":"str","severity":"good"}],` : ''}
${mode === 'full' || mode === 'flow' ? `"flow_issues": [{"title":"str","description":"str","severity":"critical|warning","recommendation":"str","user_impact":"str"}],` : ''}

Return JSON with structure: { "summary": "1-line executive overview", ${mode === 'full' ? 'test_cases, bugs, fixes, flow_issues' : mode === 'tests' ? 'test_cases' : mode === 'bugs' ? 'bugs, fixes' : 'flow_issues, test_cases'} }

Source Code:
${code}`;

    const result = parseJSON(await callGemini(prompt));
    renderCodeResults(el, result);
  } catch (e) { showError(el, e); }
}

function renderCodeResults(el, r) {
  let h = '';
  if (r.summary) h += `<div class="card summary-card"><p>${esc(r.summary)}</p></div>`;

  if (r.test_cases?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">SPEC</span><span class="r-label">Generated Test Cases</span><span class="r-count">${r.test_cases.length}</span></div>`;
    r.test_cases.forEach(t => {
      h += `<div class="card"><span class="sev info">${esc(t.type || 'unit')}</span><h4>${esc(t.name)}</h4><p class="desc">${esc(t.description)}</p>${t.code ? `<pre>${esc(t.code)}</pre>` : ''}</div>`;
    });
    h += '</div>';
  }

  if (r.bugs?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">DEFECT</span><span class="r-label">Identified Vulnerabilities</span><span class="r-count">${r.bugs.length}</span></div>`;
    r.bugs.forEach(b => {
      h += `<div class="card"><span class="sev ${b.severity || 'warning'}">${esc(b.severity || 'warning')}</span><h4>${esc(b.title)}</h4><p class="desc">${esc(b.description)}</p>${b.line_hint ? `<div class="meta-row"><span>Line Reference: ${esc(b.line_hint)}</span></div>` : ''}${b.fix_suggestion ? `<pre>Fix Suggestion: ${esc(b.fix_suggestion)}</pre>` : ''}</div>`;
    });
    h += '</div>';
  }

  if (r.fixes?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">PATCH</span><span class="r-label">Recommended Patches</span><span class="r-count">${r.fixes.length}</span></div>`;
    r.fixes.forEach(f => {
      h += `<div class="card"><span class="sev good">REFACTOR</span><h4>${esc(f.title)}</h4><p class="desc">${esc(f.description)}</p>${f.original_code ? `<pre style="border-left: 2px solid var(--red)">- ${esc(f.original_code)}</pre>` : ''}${f.fixed_code ? `<pre style="border-left: 2px solid var(--green)">+ ${esc(f.fixed_code)}</pre>` : ''}</div>`;
    });
    h += '</div>';
  }

  if (r.flow_issues?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">FLOW</span><span class="r-label">State & Flow Anomalies</span><span class="r-count">${r.flow_issues.length}</span></div>`;
    r.flow_issues.forEach(f => {
      h += `<div class="card"><span class="sev ${f.severity || 'warning'}">${esc(f.severity || 'warning')}</span><h4>${esc(f.title)}</h4><p class="desc">${esc(f.description)}</p>${f.user_impact ? `<div class="meta-row"><span>Impact: ${esc(f.user_impact)}</span></div>` : ''}${f.recommendation ? `<pre>Remediation: ${esc(f.recommendation)}</pre>` : ''}</div>`;
    });
    h += '</div>';
  }

  el.innerHTML = h || '<p style="color:var(--t-3)">No anomalies found in source code.</p>';
}

// Module 2: UI Auditor
async function runUIAudit() {
  const url = document.getElementById('uiUrl').value.trim();
  const html = document.getElementById('uiHtml').value.trim();
  const mode = document.getElementById('uiMode').value;
  const el = document.getElementById('uiResults');
  if (!url && !html) return alert('Provide a target URL or HTML source.');

  showLoading(el, 'Evaluating UI structure and accessibility standards…');
  const targetDesc = url ? `Target Endpoint: ${url}` : `Target Markup:\n${html}`;

  try {
    const prompt = `You are a UI/UX auditing engine. Analyze this web markup/endpoint.
RESPOND STRICTLY WITH VALID JSON. No markdown fences.

${targetDesc}
Mode: ${mode}

Return JSON:
{
  "summary": "1-line executive assessment",
  "score": number (0-100),
  "accessibility_issues": [{"title":"str","description":"str","severity":"critical|warning|info","wcag_ref":"WCAG 2.1 Ref","fix":"code fix"}],
  "consistency_issues": [{"title":"str","description":"str","severity":"critical|warning|info","element":"element selector","fix":"code fix"}],
  "responsive_issues": [{"title":"str","description":"str","severity":"critical|warning|info","breakpoint":"viewport width","fix":"code fix"}],
  "performance_issues": [{"title":"str","description":"str","severity":"critical|warning|info","impact":"str","fix":"code fix"}]
}`;

    const result = parseJSON(await callGemini(prompt));
    renderUIResults(el, result);
  } catch (e) { showError(el, e); }
}

function renderUIResults(el, r) {
  let h = '';
  if (r.summary) {
    const scoreColor = r.score >= 80 ? 'var(--green)' : r.score >= 50 ? 'var(--yellow)' : 'var(--red)';
    h += `<div class="card summary-card"><div style="display:flex;align-items:center;gap:14px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;color:${scoreColor}">${r.score || '--'}</div>
      <div><p style="font-size:9.5px;color:var(--t-4);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px">Compliance Index</p><p>${esc(r.summary)}</p></div>
    </div></div>`;
  }

  const sections = [
    { key: 'accessibility_issues', label: 'Accessibility (WCAG)', tag: 'A11Y' },
    { key: 'consistency_issues', label: 'Design Tokens & Consistency', tag: 'UI' },
    { key: 'responsive_issues', label: 'Viewport Constraints', tag: 'RESP' },
    { key: 'performance_issues', label: 'Performance Patterns', tag: 'PERF' }
  ];

  sections.forEach(s => {
    const items = r[s.key] || [];
    if (!items.length) return;
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">${s.tag}</span><span class="r-label">${s.label}</span><span class="r-count">${items.length}</span></div>`;
    items.forEach(i => {
      h += `<div class="card"><span class="sev ${i.severity || 'warning'}">${esc(i.severity || 'warning')}</span><h4>${esc(i.title)}</h4><p class="desc">${esc(i.description)}</p>`;
      if (i.wcag_ref) h += `<div class="meta-row"><span>Standard: ${esc(i.wcag_ref)}</span></div>`;
      if (i.element) h += `<div class="meta-row"><span>Target: ${esc(i.element)}</span></div>`;
      if (i.fix) h += `<pre>${esc(i.fix)}</pre>`;
      h += '</div>';
    });
    h += '</div>';
  });

  el.innerHTML = h || '<p style="color:var(--t-3)">Audit completed with 0 structural defects flagged.</p>';
}

// Module 3: Visual Regression
async function runVisualRegression() {
  const before = document.getElementById('vrBefore').value.trim();
  const after = document.getElementById('vrAfter').value.trim();
  const el = document.getElementById('vrResults');
  if (!before || !after) return alert('Both baseline and modified specs are required.');

  showLoading(el, 'Calculating visual diff and property variance…');
  try {
    const prompt = `You are a Visual Regression Testing engine. Compare baseline against updated UI specs.
RESPOND STRICTLY WITH VALID JSON. No markdown fences.

Baseline:
${before}

Updated:
${after}

Return JSON:
{
  "summary": "1-line diff assessment",
  "risk_level": "high|medium|low",
  "total_changes": number,
  "breaking_changes": number,
  "layout_changes": [{"element":"str","property":"str","before_value":"str","after_value":"str","severity":"critical|warning|info"}],
  "structural_changes": [{"type":"removed|added|modified","element":"str","description":"str","severity":"critical|warning|info"}],
  "recommendations": [{"title":"str","description":"str","priority":"high|medium|low"}]
}`;

    const result = parseJSON(await callGemini(prompt));
    renderVRResults(el, result);
  } catch (e) { showError(el, e); }
}

function renderVRResults(el, r) {
  let h = '';
  const riskColor = r.risk_level === 'high' ? 'var(--red)' : r.risk_level === 'medium' ? 'var(--orange)' : 'var(--green)';
  h += `<div class="card summary-card"><div style="display:flex;align-items:center;gap:12px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;padding:4px 8px;border-radius:4px;background:${riskColor}15;color:${riskColor};text-transform:uppercase">${esc(r.risk_level || 'UNKNOWN')} RISK</div>
    <div><p>${esc(r.summary || '')}</p><div class="meta-row"><span>${r.total_changes || 0} variances</span><span>${r.breaking_changes || 0} breaking</span></div></div>
  </div></div>`;

  if (r.layout_changes?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">DIFF</span><span class="r-label">Style & Token Changes</span><span class="r-count">${r.layout_changes.length}</span></div>`;
    r.layout_changes.forEach(c => {
      h += `<div class="card"><span class="sev ${c.severity || 'warning'}">${esc(c.severity || 'variance')}</span><h4>${esc(c.element)}: ${esc(c.property)}</h4><p class="desc"><span style="color:var(--red)">- ${esc(c.before_value)}</span><br><span style="color:var(--green)">+ ${esc(c.after_value)}</span></p></div>`;
    });
    h += '</div>';
  }

  if (r.structural_changes?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">DOM</span><span class="r-label">Structural Modifications</span><span class="r-count">${r.structural_changes.length}</span></div>`;
    r.structural_changes.forEach(s => {
      h += `<div class="card"><span class="sev ${s.severity || 'warning'}">${esc(s.type)}</span><h4>${esc(s.element)}</h4><p class="desc">${esc(s.description)}</p></div>`;
    });
    h += '</div>';
  }

  el.innerHTML = h || '<p style="color:var(--t-3)">No breaking layout changes detected.</p>';
}

// Module 4: API Tester
async function runAPITest() {
  const url = document.getElementById('apiUrl').value.trim();
  const method = document.getElementById('apiMethod').value;
  const body = document.getElementById('apiBody').value.trim();
  const headers = document.getElementById('apiHeaders').value.trim();
  const context = document.getElementById('apiContext').value.trim();
  const mode = document.getElementById('apiMode').value;
  const el = document.getElementById('apiResults');
  if (!url) return alert('API endpoint URL is required.');

  showLoading(el, 'Synthesizing API test suites and validation schemas…');
  try {
    const prompt = `You are an API Testing engine. Generate automated test scenarios for this contract.
RESPOND STRICTLY WITH VALID JSON. No markdown fences.

Endpoint: ${method} ${url}
${body ? `Schema: ${body}` : ''}
${headers ? `Headers: ${headers}` : ''}
${context ? `Context: ${context}` : ''}
Scope: ${mode}

Return JSON:
{
  "summary": "1-line endpoint review",
  "risk_score": number (0-100),
  "test_cases": [
    {
      "name": "str",
      "category": "validation|security|edge_case|auth|rate_limit",
      "description": "str",
      "request": { "method": "str", "url": "str", "body": "JSON or null" },
      "expected": { "status": number, "response_contains": "str" },
      "severity": "critical|high|medium|low"
    }
  ],
  "test_script": "Python requests automated test script"
}`;

    const result = parseJSON(await callGemini(prompt));
    renderAPIResults(el, result);
  } catch (e) { showError(el, e); }
}

function renderAPIResults(el, r) {
  let h = '';
  if (r.summary) {
    const sc = r.risk_score >= 70 ? 'var(--red)' : r.risk_score >= 40 ? 'var(--orange)' : 'var(--green)';
    h += `<div class="card summary-card"><div style="display:flex;align-items:center;gap:14px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;color:${sc}">${r.risk_score || '--'}</div>
      <div><p style="font-size:9.5px;color:var(--t-4);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px">Surface Risk Score</p><p>${esc(r.summary)}</p></div>
    </div></div>`;
  }

  if (r.test_cases?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">SUITE</span><span class="r-label">Generated Scenarios</span><span class="r-count">${r.test_cases.length}</span></div>`;
    r.test_cases.forEach(t => {
      h += `<div class="card"><span class="sev ${t.severity || 'medium'}">${esc(t.category)}</span><h4>${esc(t.name)}</h4><p class="desc">${esc(t.description)}</p>`;
      if (t.request) {
        h += `<pre>${esc(t.request.method)} ${esc(t.request.url)}${t.request.body ? '\nBody: ' + (typeof t.request.body === 'object' ? JSON.stringify(t.request.body, null, 2) : t.request.body) : ''}</pre>`;
      }
      if (t.expected) {
        h += `<div class="meta-row"><span>Expected Status: ${t.expected.status || 'N/A'}</span><span>Assertion: ${esc(t.expected.response_contains || 'None')}</span></div>`;
      }
      h += '</div>';
    });
    h += '</div>';
  }

  if (r.test_script) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">EXEC</span><span class="r-label">Automated Script (Python)</span></div><div class="card"><pre>${esc(r.test_script)}</pre></div></div>`;
  }

  el.innerHTML = h;
}

// Module 5: Test Prioritizer
async function runPrioritizer() {
  const input = document.getElementById('priInput').value.trim();
  const mode = document.getElementById('priMode').value;
  const el = document.getElementById('priResults');
  if (!input) return alert('Test case or feature matrix input cannot be empty.');

  showLoading(el, 'Executing risk ranking and dependency graph analysis…');
  try {
    const prompt = `You are a Smart Test Selection and Test Prioritization engine. Rank these test suites.
RESPOND STRICTLY WITH VALID JSON. No markdown fences.

Suite Matrix:
${input}
Optimization Mode: ${mode}

Return JSON:
{
  "summary": "1-line execution strategy",
  "total_items": number,
  "prioritized_tests": [
    {
      "rank": number,
      "name": "str",
      "risk_score": number (0-100),
      "priority_tier": "P0|P1|P2|P3",
      "reasoning": "str",
      "estimated_time": "str",
      "automation_status": "automated|manual"
    }
  ],
  "execution_plan": {
    "phase_1_smoke": ["test names (< 3 min)"],
    "phase_2_critical": ["test names (< 15 min)"],
    "phase_3_extended": ["remaining test names"]
  }
}`;

    const result = parseJSON(await callGemini(prompt));
    renderPriResults(el, result);
  } catch (e) { showError(el, e); }
}

function renderPriResults(el, r) {
  let h = '';
  if (r.summary) {
    h += `<div class="card summary-card"><p style="font-size:9.5px;color:var(--t-4);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px">Prioritization Strategy</p><p>${esc(r.summary)}</p></div>`;
  }

  if (r.execution_plan) {
    const ep = r.execution_plan;
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">PLAN</span><span class="r-label">Pipeline Schedule</span></div>`;
    if (ep.phase_1_smoke?.length) {
      h += `<div class="card"><span class="sev critical">STAGE 1: SMOKE</span><h4>Fast Feedback (< 3 min)</h4><p class="desc">${ep.phase_1_smoke.map(esc).join(' → ')}</p></div>`;
    }
    if (ep.phase_2_critical?.length) {
      h += `<div class="card"><span class="sev warning">STAGE 2: CRITICAL</span><h4>Core Regression (< 15 min)</h4><p class="desc">${ep.phase_2_critical.map(esc).join(' → ')}</p></div>`;
    }
    if (ep.phase_3_extended?.length) {
      h += `<div class="card"><span class="sev info">STAGE 3: EXTENDED</span><h4>Full Suite</h4><p class="desc">${ep.phase_3_extended.map(esc).join(' → ')}</p></div>`;
    }
    h += '</div>';
  }

  if (r.prioritized_tests?.length) {
    h += `<div class="r-section"><div class="r-header"><span class="r-tag">RANK</span><span class="r-label">Ordered Test Queue</span><span class="r-count">${r.prioritized_tests.length}</span></div><div class="priority-list">`;
    r.prioritized_tests.forEach(t => {
      const tier = t.priority_tier || 'P2';
      const tierCls = tier === 'P0' ? 'critical' : tier === 'P1' ? 'high' : 'info';
      h += `<div class="pri-item"><div class="pri-rank">#${t.rank}</div><div class="pri-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <h4>${esc(t.name)}</h4>
          <span class="sev ${tierCls}" style="margin:0">${esc(tier)}</span>
        </div>
        <p class="desc">${esc(t.reasoning)}</p>
        <div class="meta-row">
          <span>Est: ${esc(t.estimated_time || 'N/A')}</span>
          <span>Risk Index: ${t.risk_score || 0}/100</span>
          <span>Mode: ${esc(t.automation_status || 'automated')}</span>
        </div>
      </div></div>`;
    });
    h += '</div></div>';
  }

  el.innerHTML = h;
}