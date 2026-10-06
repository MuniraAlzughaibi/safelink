import type { MessageReport } from '../analyzer/message';
import type { Finding, Report, Verdict } from '../analyzer/types';

const VERDICT_TEXT: Record<Verdict, { label: string; summary: string; advice: string }> = {
  safe: {
    label: 'آمن',
    summary: 'لم نجد مؤشرات احتيال واضحة.',
    advice: 'ومع ذلك، تأكد من مصدر الرابط ولا تُدخل بياناتك إلا في التطبيقات والمواقع الرسمية.',
  },
  suspicious: {
    label: 'مشبوه',
    summary: 'وجدنا مؤشرات تستدعي الحذر.',
    advice: 'لا تُدخل أي بيانات. تحقق من الجهة بالدخول إلى تطبيقها الرسمي أو الاتصال برقمها المعروف.',
  },
  dangerous: {
    label: 'خطير',
    summary: 'مؤشرات قوية على محاولة احتيال.',
    advice: 'لا تضغط على الرابط ولا تشارك أي بيانات أو رموز. احذف الرسالة، وإذا أدخلت بياناتك تواصل مع بنكك فورًا.',
  },
};

const SEVERITY_ICON: Record<Finding['severity'], string> = {
  good: '✓',
  info: 'i',
  warn: '!',
  danger: '✕',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function findingsHtml(findings: Finding[]): string {
  return `<ul class="findings">${findings
    .map(
      (f) => `<li class="finding ${f.severity}">
        <span class="icon" aria-hidden="true">${SEVERITY_ICON[f.severity]}</span>
        <div><strong>${escapeHtml(f.title)}</strong><p>${escapeHtml(f.detail)}</p></div>
      </li>`,
    )
    .join('')}</ul>`;
}

function verdictHtml(report: Report, subject: string): string {
  const v = VERDICT_TEXT[report.verdict];
  return `<div class="verdict ${report.verdict}">
      <div class="verdict-badge">${v.label}</div>
      <div class="verdict-body">
        <p class="subject" dir="ltr">${escapeHtml(subject)}</p>
        <p class="summary">${v.summary}</p>
        <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${report.score}"
             aria-label="درجة الخطورة"><span style="width:${Math.max(4, report.score)}%"></span></div>
        <p class="score">درجة الخطورة: ${report.score} / 100</p>
      </div>
    </div>`;
}

function adviceHtml(verdict: Verdict): string {
  return `<div class="advice ${verdict}"><strong>وش أسوي؟</strong> ${VERDICT_TEXT[verdict].advice}</div>`;
}

export function renderLinkReport(link: string, report: Report): string {
  return `<article class="card result">
      ${verdictHtml(report, link)}
      ${findingsHtml(report.findings)}
      ${adviceHtml(report.verdict)}
    </article>`;
}

export function renderMessageReport(text: string, report: MessageReport): string {
  const preview = text.length > 90 ? `${text.slice(0, 90)}…` : text;
  const links = report.links.length
    ? `<h3>الروابط في الرسالة</h3>${report.links
        .map(
          ({ link, report: r }) => `<details class="link-detail ${r.verdict}">
            <summary><span class="pill ${r.verdict}">${VERDICT_TEXT[r.verdict].label}</span>
              <span dir="ltr">${escapeHtml(link)}</span></summary>
            ${findingsHtml(r.findings)}
          </details>`,
        )
        .join('')}`
    : '';
  return `<article class="card result">
      ${verdictHtml(report, preview).replace('dir="ltr"', 'dir="auto"')}
      ${findingsHtml(report.findings)}
      ${links}
      ${adviceHtml(report.verdict)}
    </article>`;
}

export function renderInvalid(message: string): string {
  return `<div class="card notice">${escapeHtml(message)}</div>`;
}

export function verdictLabel(v: Verdict): string {
  return VERDICT_TEXT[v].label;
}

export { escapeHtml };
