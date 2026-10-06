/**
 * Official domains of organisations that scammers commonly impersonate in
 * Saudi Arabia (banks, payment providers, government services, couriers).
 *
 * `keywords` are brand fragments that show up in fake domains
 * (e.g. "alrajhi-update.xyz"). A host containing a keyword that is NOT one of
 * the organisation's official domains is treated as impersonation.
 */
export interface Organisation {
  name: string;
  domains: string[];
  keywords: string[];
}

export const ORGANISATIONS: Organisation[] = [
  { name: 'مصرف الراجحي', domains: ['alrajhibank.com.sa', 'alrajhi-capital.sa'], keywords: ['alrajhi', 'rajhi'] },
  { name: 'البنك الأهلي السعودي', domains: ['alahli.com'], keywords: ['alahli', 'ahli'] },
  { name: 'بنك الرياض', domains: ['riyadbank.com'], keywords: ['riyadbank', 'riyad-bank'] },
  { name: 'البنك السعودي الأول (ساب)', domains: ['sab.com'], keywords: ['sabbank', 'sab-bank'] },
  { name: 'مصرف الإنماء', domains: ['alinma.com'], keywords: ['alinma', 'inma'] },
  { name: 'بنك البلاد', domains: ['bankalbilad.com'], keywords: ['albilad', 'bilad'] },
  { name: 'بنك الجزيرة', domains: ['bankaljazira.com', 'baj.com.sa'], keywords: ['aljazira', 'jazira'] },
  { name: 'البنك السعودي للاستثمار', domains: ['saib.com.sa'], keywords: ['saib'] },
  { name: 'البنك العربي الوطني', domains: ['anb.com.sa'], keywords: ['anbbank', 'anb-bank'] },
  { name: 'البنك السعودي الفرنسي', domains: ['alfransi.com.sa'], keywords: ['alfransi', 'fransi'] },
  { name: 'البنك المركزي السعودي', domains: ['sama.gov.sa'], keywords: ['sama'] },
  { name: 'STC Pay', domains: ['stcpay.com.sa', 'stc.com.sa'], keywords: ['stcpay', 'stc-pay'] },
  { name: 'urpay', domains: ['urpay.com.sa'], keywords: ['urpay'] },
  { name: 'مدى', domains: ['mada.com.sa'], keywords: ['mada'] },
  { name: 'سداد', domains: ['sadad.com'], keywords: ['sadad'] },
  { name: 'أبشر', domains: ['absher.sa'], keywords: ['absher', 'abshr'] },
  { name: 'وزارة الداخلية', domains: ['moi.gov.sa'], keywords: ['moi-'] },
  { name: 'المنصة الوطنية الموحدة', domains: ['my.gov.sa'], keywords: [] },
  { name: 'هيئة الزكاة والضريبة والجمارك', domains: ['zatca.gov.sa'], keywords: ['zatca'] },
  { name: 'ناجز', domains: ['najiz.sa'], keywords: ['najiz'] },
  { name: 'سبل (البريد السعودي)', domains: ['splonline.com.sa'], keywords: ['spl', 'splonline', 'saudipost', 'saudi-post'] },
  { name: 'سمسا', domains: ['smsaexpress.com'], keywords: ['smsa'] },
  { name: 'تابي', domains: ['tabby.ai'], keywords: ['tabby'] },
  { name: 'تمارا', domains: ['tamara.co'], keywords: ['tamara'] },
];

/** Public URL shorteners: they hide the real destination. */
export const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc',
  'ow.ly', 's.id', 't.ly', 'rebrand.ly', 'shorte.st', 'v.gd', 'bl.ink', 'lnkd.in',
  'tinyurl.is', 'goo.su', 'clck.ru', 'u.to',
]);

/** Cheap or free TLDs that are heavily abused in phishing campaigns. */
export const RISKY_TLDS = new Set([
  'xyz', 'top', 'icu', 'click', 'link', 'buzz', 'live', 'online', 'site', 'shop',
  'info', 'cc', 'tk', 'ml', 'ga', 'cf', 'gq', 'rest', 'cyou', 'sbs', 'cfd', 'monster',
  'quest', 'support', 'help', 'vip', 'work', 'zip', 'mov',
]);

/** Multi-label public suffixes we need to resolve registrable domains correctly. */
export const MULTI_PART_SUFFIXES = new Set([
  'com.sa', 'net.sa', 'org.sa', 'gov.sa', 'edu.sa', 'med.sa', 'pub.sa', 'sch.sa',
  'co.uk', 'org.uk', 'com.au', 'co.jp', 'com.eg', 'com.kw', 'com.qa', 'co.ae',
]);
