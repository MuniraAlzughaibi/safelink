import { MULTI_PART_SUFFIXES, ORGANISATIONS, RISKY_TLDS, SHORTENERS, type Organisation } from '../data/trusted';
import { buildReport, type Finding, type Report } from './types';

export interface ParsedUrl {
  url: URL;
  host: string;
  /** e.g. "alrajhibank.com.sa" for "online.alrajhibank.com.sa". */
  registrableDomain: string;
  /** The label right before the public suffix, e.g. "alrajhibank". */
  mainLabel: string;
  tld: string;
}

/** Accepts links with or without a scheme ("example.com/x" works too). */
export function parseUrl(input: string): ParsedUrl | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') && !isIp(host)) return null;

  const labels = host.split('.');
  const lastTwo = labels.slice(-2).join('.');
  const suffixLabels = MULTI_PART_SUFFIXES.has(lastTwo) ? 2 : 1;
  const registrableDomain = labels.slice(-(suffixLabels + 1)).join('.');
  const mainLabel = labels[labels.length - suffixLabels - 1] ?? host;
  return { url, host, registrableDomain, mainLabel, tld: labels[labels.length - 1] };
}

function isIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[');
}

/** Levenshtein distance, used to catch typo-squatting ("alrajhlbank"). */
export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Undo common character swaps scammers use (0→o, 1→l, rn→m...). */
function normaliseLookalikes(s: string): string {
  return s
    .replace(/0/g, 'o')
    .replace(/[1|]/g, 'l')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w');
}

export function findOfficialOrg(registrableDomain: string): Organisation | undefined {
  return ORGANISATIONS.find((o) => o.domains.includes(registrableDomain));
}

function hostTokens(host: string): string[] {
  return host.split(/[.-]/).filter(Boolean);
}

/** Organisation whose brand appears in the host although the domain isn't theirs. */
function findImpersonatedOrg(parsed: ParsedUrl): Organisation | undefined {
  const tokens = hostTokens(parsed.host);
  return ORGANISATIONS.find((org) =>
    org.keywords.some((kw) => {
      const k = kw.replace(/-$/, '');
      return tokens.some((t) => t === k || (k.length >= 6 && t.includes(k)));
    }),
  );
}

/** Organisation whose official domain looks almost the same as this one. */
function findLookalikeOrg(parsed: ParsedUrl): { org: Organisation; official: string } | undefined {
  const label = normaliseLookalikes(parsed.mainLabel);
  for (const org of ORGANISATIONS) {
    for (const domain of org.domains) {
      const officialLabel = domain.split('.')[0];
      // Official domains never reach here, so an identical label on another
      // suffix (alrajhibank.com vs alrajhibank.com.sa) is itself a lookalike.
      if (officialLabel.length < 5) continue;
      const distance = editDistance(label, officialLabel);
      const allowed = officialLabel.length >= 9 ? 2 : 1;
      if (label === officialLabel || distance <= allowed) return { org, official: domain };
    }
  }
  return undefined;
}

const SENSITIVE_PATH_WORDS = [
  'login', 'signin', 'verify', 'verification', 'update', 'account', 'secure', 'otp',
  'confirm', 'password', 'card', 'payment', 'refund', 'unlock', 'suspend', 'wallet',
];

export function analyzeUrl(input: string): Report | null {
  const parsed = parseUrl(input);
  if (!parsed) return null;
  const { url, host, registrableDomain, tld } = parsed;
  const findings: Finding[] = [];
  const official = findOfficialOrg(registrableDomain);
  const isGov = registrableDomain.endsWith('.gov.sa');

  if (official || isGov) {
    findings.push({
      severity: 'good',
      title: 'نطاق رسمي معروف',
      detail: official
        ? `هذا هو النطاق الرسمي لـ ${official.name} (${registrableDomain}).`
        : 'نطاقات gov.sa مخصصة للجهات الحكومية السعودية فقط.',
      weight: 0,
    });
  } else {
    const lookalike = findLookalikeOrg(parsed);
    const impersonated = findImpersonatedOrg(parsed);
    if (lookalike) {
      findings.push({
        severity: 'danger',
        title: `ينتحل نطاق ${lookalike.org.name}`,
        detail: `النطاق "${registrableDomain}" يشبه النطاق الرسمي "${lookalike.official}" مع اختلاف بسيط في الحروف، وهذا من أشهر أساليب التصيد.`,
        weight: 65,
      });
    } else if (impersonated) {
      findings.push({
        severity: 'danger',
        title: `يستخدم اسم ${impersonated.name} في نطاق غير رسمي`,
        detail: `الرابط يحتوي اسم الجهة لكنه ليس من نطاقها الرسمي (${impersonated.domains.join('، ')}).`,
        weight: 50,
      });
    }
  }

  if (isIp(host)) {
    findings.push({
      severity: 'danger',
      title: 'الرابط عنوان IP بدل اسم موقع',
      detail: 'الجهات الرسمية لا ترسل روابط بأرقام مباشرة، وهذا يُستخدم لإخفاء هوية الموقع.',
      weight: 45,
    });
  }

  if (host.includes('xn--') || /[^\x00-\x7f]/.test(url.hostname)) {
    findings.push({
      severity: 'danger',
      title: 'حروف مموّهة في اسم الموقع',
      detail: 'اسم الموقع يحتوي حروفًا من لغات أخرى تشبه الحروف الإنجليزية (Punycode) لخداع العين.',
      weight: 45,
    });
  }

  if (url.username || input.includes('@')) {
    findings.push({
      severity: 'danger',
      title: 'الرابط يحتوي الرمز @',
      detail: 'كل ما قبل @ في الرابط يتم تجاهله، فيبدو الرابط لجهة موثوقة بينما يفتح موقعًا آخر.',
      weight: 60,
    });
  }

  if (SHORTENERS.has(registrableDomain) || SHORTENERS.has(host)) {
    findings.push({
      severity: 'warn',
      title: 'رابط مختصر يخفي الوجهة الحقيقية',
      detail: 'لا يمكن معرفة الموقع الذي سيفتحه الرابط قبل الضغط عليه. الجهات الرسمية نادرًا ما تستخدمه في رسائلها.',
      weight: 30,
    });
  }

  if (RISKY_TLDS.has(tld)) {
    findings.push({
      severity: 'warn',
      title: `امتداد نطاق شائع في الاحتيال (\u2066.${tld}\u2069)`,
      detail: 'هذا الامتداد رخيص وسهل التسجيل، ويُستخدم كثيرًا في مواقع التصيد المؤقتة.',
      weight: 25,
    });
  }

  if (url.protocol === 'http:' && /^https?:\/\//i.test(input.trim())) {
    findings.push({
      severity: 'warn',
      title: 'الاتصال غير مشفّر (HTTP)',
      detail: 'أي بيانات تُدخلها في هذا الموقع قد تُقرأ أثناء انتقالها. لا تُدخل بيانات حساسة.',
      weight: 15,
    });
  }

  const subdomainCount = host.split('.').length - registrableDomain.split('.').length;
  if (subdomainCount >= 3) {
    findings.push({
      severity: 'warn',
      title: 'عدد كبير من النطاقات الفرعية',
      detail: `الاسم الحقيقي للموقع هو "${registrableDomain}"، وما قبله قد يكون لتضليلك.`,
      weight: 15,
    });
  }

  if (url.port && !['80', '443'].includes(url.port)) {
    findings.push({
      severity: 'warn',
      title: `منفذ غير معتاد (\u2066${url.port}\u2069)`,
      detail: 'المواقع الرسمية لا تستخدم منافذ خاصة في روابطها العامة.',
      weight: 15,
    });
  }

  const path = decodeURIComponent(url.pathname + url.search).toLowerCase();
  const sensitive = SENSITIVE_PATH_WORDS.filter((w) => path.includes(w));
  if (sensitive.length && !official && !isGov) {
    findings.push({
      severity: 'warn',
      title: 'الرابط يطلب تسجيل دخول أو تحديث بيانات',
      detail: `يحتوي كلمات مثل: ${sensitive.slice(0, 3).join('، ')}. تأكد من الموقع قبل إدخال أي بيانات.`,
      weight: 15,
    });
  }

  if ((host.match(/-/g) ?? []).length >= 3) {
    findings.push({
      severity: 'info',
      title: 'اسم موقع طويل بشرطات كثيرة',
      detail: 'المواقع المزيفة كثيرًا ما تجمع كلمات مثل "secure-login-update" لتبدو رسمية.',
      weight: 10,
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      title: 'لا توجد مؤشرات احتيال واضحة',
      detail: 'لم نجد علامات خطر معروفة، لكن هذا لا يضمن أن الموقع آمن. تأكد دائمًا من مصدر الرابط.',
      weight: 0,
    });
  }

  const hasHardRisk = findings.some((f) => f.severity === 'danger');
  return buildReport(findings, (official !== undefined || isGov) && !hasHardRisk);
}
