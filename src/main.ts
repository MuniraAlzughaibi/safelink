import './style.css';
import { analyzeMessage } from './analyzer/message';
import type { Verdict } from './analyzer/types';
import { analyzeUrl } from './analyzer/url';
import { EXAMPLE_LINKS, EXAMPLE_MESSAGES, TIPS } from './data/examples';
import { escapeHtml, renderInvalid, renderLinkReport, renderMessageReport, verdictLabel } from './ui/render';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// ── Tabs ─────────────────────────────────────────────────────────────
type Tab = 'link' | 'message' | 'learn' | 'about';

function showTab(tab: Tab) {
  document.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  document.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((p) => {
    p.hidden = p.id !== `tab-${tab}`;
  });
  history.replaceState(null, '', `#${tab}`);
}

document.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((b) =>
  b.addEventListener('click', () => showTab(b.dataset.tab as Tab)),
);

// ── Recent scans (per-browser convenience only) ──────────────────────
interface HistoryItem {
  kind: 'link' | 'message';
  text: string;
  verdict: Verdict;
}
const HISTORY_KEY = 'safelink:history';

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(item: HistoryItem) {
  const items = [item, ...loadHistory().filter((h) => h.text !== item.text)].slice(0, 5);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode): history is optional.
  }
  renderHistory();
}

function renderHistory() {
  const items = loadHistory();
  $('#history').hidden = items.length === 0;
  $('#history-list').innerHTML = items
    .map(
      (h, i) => `<li><button data-i="${i}">
        <span class="pill ${h.verdict}">${verdictLabel(h.verdict)}</span>
        <span class="h-text" dir="auto">${escapeHtml(h.text.slice(0, 70))}</span>
      </button></li>`,
    )
    .join('');
  $('#history-list').querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      const h = items[Number(b.dataset.i)];
      h.kind === 'link' ? runLink(h.text) : runMessage(h.text);
    }),
  );
}

// ── Link scan ────────────────────────────────────────────────────────
function runLink(link: string) {
  showTab('link');
  $<HTMLInputElement>('#link-input').value = link;
  const report = analyzeUrl(link);
  const out = $('#link-result');
  if (!report) {
    out.innerHTML = renderInvalid('هذا لا يبدو رابطًا صحيحًا. انسخ الرابط كاملًا، مثل: example.com/page');
    return;
  }
  out.innerHTML = renderLinkReport(link.trim(), report);
  saveHistory({ kind: 'link', text: link.trim(), verdict: report.verdict });
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#link-form').addEventListener('submit', (e) => {
  e.preventDefault();
  runLink($<HTMLInputElement>('#link-input').value);
});

// ── Message scan ─────────────────────────────────────────────────────
function runMessage(text: string) {
  showTab('message');
  $<HTMLTextAreaElement>('#message-input').value = text;
  const report = analyzeMessage(text);
  const out = $('#message-result');
  if (!report) {
    out.innerHTML = renderInvalid('اكتب أو الصق نص الرسالة أولًا.');
    return;
  }
  out.innerHTML = renderMessageReport(text.trim(), report);
  saveHistory({ kind: 'message', text: text.trim(), verdict: report.verdict });
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#message-form').addEventListener('submit', (e) => {
  e.preventDefault();
  runMessage($<HTMLTextAreaElement>('#message-input').value);
});

// ── Examples & tips ──────────────────────────────────────────────────
function addChips(container: string, items: { label: string; value: string }[], run: (v: string) => void) {
  const el = $(container);
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = item.label;
    b.addEventListener('click', () => run(item.value));
    el.append(b);
  }
}

addChips(
  '#link-examples',
  EXAMPLE_LINKS.map((l) => ({ label: new URL(l).hostname.replace(/^www\./, ''), value: l })),
  runLink,
);
addChips(
  '#message-examples',
  EXAMPLE_MESSAGES.map((m) => ({ label: m.label, value: m.text })),
  runMessage,
);

$('#tips').innerHTML =
  TIPS.map((t, i) => `<div class="card tip"><span class="num">${i + 1}</span><h3>${t.title}</h3><p>${t.body}</p></div>`).join('') +
  `<div class="card tip examples"><h3>جرّب على رسائل احتيال حقيقية الأسلوب</h3>
    <div class="chips" id="learn-examples"></div></div>`;
addChips(
  '#learn-examples',
  EXAMPLE_MESSAGES.map((m) => ({ label: m.label, value: m.text })),
  runMessage,
);

// ── Startup ──────────────────────────────────────────────────────────
const initial = location.hash.slice(1) as Tab;
if (['link', 'message', 'learn', 'about'].includes(initial)) showTab(initial);
renderHistory();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
