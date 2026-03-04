const STORAGE_KEY = 'replypilot_history_v3';

const roleEl = document.getElementById('role');
const otherRoleWrapEl = document.getElementById('otherRoleWrap');
const otherRoleEl = document.getElementById('otherRole');

const intentEl = document.getElementById('intent');
const otherIntentWrapEl = document.getElementById('otherIntentWrap');
const otherIntentEl = document.getElementById('otherIntent');

const closenessEl = document.getElementById('closeness');
const closenessValueEl = document.getElementById('closenessValue');
const formalityEl = document.getElementById('formality');
const warmthEl = document.getElementById('warmth');
const formalityValueEl = document.getElementById('formalityValue');
const warmthValueEl = document.getElementById('warmthValue');

const styleTuneEl = document.getElementById('styleTune');
const customStyleEl = document.getElementById('customStyle');
const originalMessageEl = document.getElementById('originalMessage');
const trueThoughtEl = document.getElementById('trueThought');

const providerPresetEl = document.getElementById('providerPreset');
const modelSelectEl = document.getElementById('modelSelect');
const customModelEl = document.getElementById('customModel');
const baseUrlEl = document.getElementById('baseUrl');
const apiKeyEl = document.getElementById('apiKey');

const generateBtn = document.getElementById('generateBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const historyEl = document.getElementById('history');
const resultTemplate = document.getElementById('resultTemplate');

const PRESETS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1']
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    models: ['MiniMax-Text-01', 'abab6.5s-chat', 'abab6.5-chat']
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max']
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
  },
  custom: { baseUrl: '', models: ['custom-model'] }
};

function fillModelSelect(models, selected) {
  modelSelectEl.innerHTML = '';
  models.forEach((m) => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    if (m === selected) option.selected = true;
    modelSelectEl.appendChild(option);
  });
}

function setStatus(text, type = '') {
  statusEl.className = `status ${type}`.trim();
  statusEl.textContent = text;
}

function closenessText(v) {
  if (v <= 20) return '陌生';
  if (v <= 60) return '一般';
  return '亲密';
}

function updateSliderLabels() {
  closenessValueEl.textContent = `${closenessEl.value}%（${closenessText(Number(closenessEl.value))}）`;
  formalityValueEl.textContent = formalityEl.value;
  warmthValueEl.textContent = warmthEl.value;
}

function toggleRoleInput() {
  otherRoleWrapEl.classList.toggle('hidden', roleEl.value !== '其他');
}

function toggleIntentInput() {
  otherIntentWrapEl.classList.toggle('hidden', intentEl.value !== '其他');
}

function applyProviderPreset() {
  const preset = PRESETS[providerPresetEl.value];
  if (!preset) return;
  baseUrlEl.value = preset.baseUrl;
  fillModelSelect(preset.models, preset.models[0]);
  if (providerPresetEl.value !== 'custom') customModelEl.value = '';
}

function getModelValue() {
  return customModelEl.value.trim() || modelSelectEl.value;
}

function getPayload() {
  const role = roleEl.value === '其他' ? otherRoleEl.value.trim() : roleEl.value;
  const intent = intentEl.value === '其他' ? otherIntentEl.value.trim() : intentEl.value;
  return {
    role,
    roleRaw: roleEl.value,
    intent,
    intentRaw: intentEl.value,
    closeness: Number(closenessEl.value),
    formality: Number(formalityEl.value),
    warmth: Number(warmthEl.value),
    styleTune: styleTuneEl.value,
    customStyle: customStyleEl.value.trim(),
    originalMessage: originalMessageEl.value.trim(),
    trueThought: trueThoughtEl.value.trim()
  };
}

function validate(payload) {
  if (payload.roleRaw === '其他' && !payload.role) return '请选择“其他身份”后填写具体身份';
  if (payload.intentRaw === '其他' && !payload.intent) return '请选择“其他目的”后填写具体目的';
  if (!payload.originalMessage) return '请填写“原消息”';
  if (!payload.trueThought) return '请填写“你的真实想法”';
  if (!baseUrlEl.value.trim()) return '请填写 Base URL';
  if (!apiKeyEl.value.trim()) return '请填写 API Key';
  if (!getModelValue()) return '请选择或填写模型名';
  return '';
}

function buildPrompt(payload) {
  return `你是消息回复辅助系统，请只输出JSON。\n
输入：\n
- 对方身份: ${payload.role}\n
- 关系亲密度: ${payload.closeness}%（${closenessText(payload.closeness)}）\n
- 目的: ${payload.intent}\n
- 原消息: ${payload.originalMessage}\n
- 用户真实想法: ${payload.trueThought}\n
- 正式度: ${payload.formality}/100\n
- 热情度: ${payload.warmth}/100\n
- 风格预设: ${payload.styleTune || '默认'}\n
- 自定义风格: ${payload.customStyle || '无'}\n
请生成 formal / friendly / humorous 三条回复，每条包含:\n
replyText、assessment、riskLevel(低/中/高)。\n
只允许输出如下JSON结构:\n
{"formal":{"replyText":"","assessment":"","riskLevel":"低"},"friendly":{"replyText":"","assessment":"","riskLevel":"中"},"humorous":{"replyText":"","assessment":"","riskLevel":"高"}}`;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1));
    throw new Error('模型返回不是合法 JSON');
  }
}

async function callApi(prompt) {
  const baseUrl = baseUrlEl.value.trim().replace(/\/$/, '');
  const apiKey = apiKeyEl.value.trim();
  const model = getModelValue();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: '你是一个严谨的JSON输出助手。' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API请求失败(${res.status})：${txt.slice(0, 180)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('未从响应中获取到模型文本');
  return safeJsonParse(content);
}

function normalizeItem(node, title) {
  const risk = ['低', '中', '高'].includes(node?.riskLevel) ? node.riskLevel : '中';
  return {
    styleType: title,
    replyText: node?.replyText || '（模型未返回文本）',
    assessment: node?.assessment || '（模型未返回情感评估）',
    riskLevel: risk,
    riskClass: risk === '低' ? 'risk-low' : risk === '高' ? 'risk-high' : 'risk-mid'
  };
}

function normalizeResult(raw) {
  return [
    normalizeItem(raw.formal, '正式风格'),
    normalizeItem(raw.friendly, '亲切风格'),
    normalizeItem(raw.humorous, '幽默风格')
  ];
}

function renderResults(items) {
  resultsEl.innerHTML = '';
  resultsEl.classList.remove('empty');
  items.forEach((item) => {
    const node = resultTemplate.content.cloneNode(true);
    node.querySelector('h3').textContent = item.styleType;
    node.querySelector('.reply-text').textContent = item.replyText;
    node.querySelector('.assessment').textContent = item.assessment;
    const riskEl = node.querySelector('.risk');
    riskEl.textContent = `${item.riskLevel}风险`;
    riskEl.classList.add(item.riskClass);
    node.querySelector('.copy-btn').addEventListener('click', async () => {
      await navigator.clipboard.writeText(item.replyText);
      setStatus(`${item.styleType}已复制`);
    });
    resultsEl.appendChild(node);
  });
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function fillForm(payload) {
  roleEl.value = payload.roleRaw || '朋友';
  otherRoleEl.value = payload.roleRaw === '其他' ? payload.role : '';
  intentEl.value = payload.intentRaw || '回应请求';
  otherIntentEl.value = payload.intentRaw === '其他' ? payload.intent : '';
  closenessEl.value = payload.closeness ?? 50;
  formalityEl.value = payload.formality ?? 70;
  warmthEl.value = payload.warmth ?? 60;
  styleTuneEl.value = payload.styleTune || '';
  customStyleEl.value = payload.customStyle || '';
  originalMessageEl.value = payload.originalMessage || '';
  trueThoughtEl.value = payload.trueThought || '';
  toggleRoleInput();
  toggleIntentInput();
  updateSliderLabels();
}

function renderHistory() {
  const list = loadHistory();
  historyEl.innerHTML = '';
  if (!list.length) {
    historyEl.classList.add('empty');
    historyEl.textContent = '暂无历史记录';
    return;
  }
  historyEl.classList.remove('empty');

  list.forEach((record, index) => {
    const el = document.createElement('article');
    el.className = 'history-item';

    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = `${record.time}｜${record.payload.role}｜${record.payload.intent}｜亲密度${record.payload.closeness}%`;

    const brief = document.createElement('p');
    brief.textContent = `原消息：${record.payload.originalMessage}`;

    const actions = document.createElement('div');
    actions.className = 'history-actions';
    const useBtn = document.createElement('button');
    useBtn.textContent = '载入';
    useBtn.onclick = () => {
      fillForm(record.payload);
      renderResults(record.results);
      setStatus('已载入历史记录');
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = '删除';
    delBtn.onclick = () => {
      const latest = loadHistory();
      latest.splice(index, 1);
      saveHistory(latest);
      renderHistory();
    };

    actions.append(useBtn, delBtn);
    el.append(meta, brief, actions);
    historyEl.appendChild(el);
  });
}

function pushHistory(payload, results) {
  const list = loadHistory();
  list.unshift({
    id: crypto.randomUUID(),
    time: new Date().toLocaleString('zh-CN'),
    payload,
    results
  });
  saveHistory(list.slice(0, 30));
  renderHistory();
}

async function onGenerate() {
  const payload = getPayload();
  const err = validate(payload);
  if (err) {
    setStatus(err, 'error');
    return;
  }

  setStatus('正在调用 API 生成，请稍候...', 'loading');
  generateBtn.disabled = true;
  try {
    const raw = await callApi(buildPrompt(payload));
    const results = normalizeResult(raw);
    renderResults(results);
    pushHistory(payload, results);
    setStatus('生成成功（API）');
  } catch (e) {
    setStatus(`生成失败：${e.message}`, 'error');
  } finally {
    generateBtn.disabled = false;
  }
}

roleEl.addEventListener('change', toggleRoleInput);
intentEl.addEventListener('change', toggleIntentInput);
providerPresetEl.addEventListener('change', applyProviderPreset);
closenessEl.addEventListener('input', updateSliderLabels);
formalityEl.addEventListener('input', updateSliderLabels);
warmthEl.addEventListener('input', updateSliderLabels);
generateBtn.addEventListener('click', onGenerate);

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  setStatus('历史记录已清空');
});

toggleRoleInput();
toggleIntentInput();
applyProviderPreset();
updateSliderLabels();
renderHistory();