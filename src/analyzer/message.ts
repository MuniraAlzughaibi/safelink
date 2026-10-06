import { buildReport, type Finding, type Report } from './types';
import { analyzeUrl } from './url';

interface ScamPattern {
  id: string;
  title: string;
  detail: string;
  weight: number;
  patterns: RegExp[];
}

/**
 * Tactics seen in scam SMS / WhatsApp messages in Saudi Arabia.
 * Arabic text is normalised first (see `normaliseArabic`), so patterns are
 * written without hamza/taa-marbuta variants.
 */
export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: 'otp',
    title: 'يطلب رمز التحقق أو الرقم السري',
    detail: 'لا توجد جهة رسمية تطلب منك رمز التحقق (OTP) أو الرقم السري. هذا أخطر مؤشر احتيال.',
    weight: 60,
    patterns: [
      // Whole words only, so "لا تشارك الرمز" / "عدم مشاركة الرمز" (legit warnings) don't match.
      /(?:^|\s)(ارسل|ارسال|زودنا|شارك|شاركنا|اعطنا|اعطني)\s[^.\n]{0,25}(رمز|الرمز|كود|الكود|الرقم السري)/,
      /(?<!(?:not|never|don't|do not)\s)\b(send|share|provide)\b[^.\n]{0,25}\b(otp|code|pin|password)\b/i,
    ],
  },
  {
    id: 'suspension',
    title: 'تهديد بإيقاف الحساب أو البطاقة',
    detail: 'رسائل "تم إيقاف حسابك" أو "سيتم تجميد بطاقتك" تهدف لإخافتك ودفعك للضغط بسرعة.',
    weight: 35,
    patterns: [
      /(ايقاف|تعليق|تجميد|حظر|اغلاق|تعطيل)[^.\n]{0,20}(حساب|بطاق|محفظ|خدم)/,
      /(حساب|بطاق|محفظ)[^.\n]{0,20}(موقوف|معلق|مجمد|محظور|مغلق|معطل)/,
      /(account|card)[^.\n]{0,20}(suspend|block|lock|frozen|disabled)/i,
    ],
  },
  {
    id: 'update',
    title: 'يطلب تحديث البيانات عبر رابط',
    detail: 'البنوك والجهات الحكومية لا تطلب تحديث بياناتك عبر روابط في الرسائل. حدّثها من التطبيق الرسمي فقط.',
    weight: 30,
    patterns: [/تحديث[^.\n]{0,15}(بيانات|معلومات|هوي)/, /(update|verify|confirm)[^.\n]{0,20}(details|information|account|data)/i],
  },
  {
    id: 'urgency',
    title: 'ضغط وإلحاح بوقت محدد',
    detail: 'عبارات مثل "خلال 24 ساعة" و"فورًا" و"آخر فرصة" تُستخدم لمنعك من التفكير والتحقق.',
    weight: 20,
    patterns: [/(خلال|قبل)\s*\d+\s*(ساع|دقيق|يوم)/, /(فورا|عاجل|حالا|اخر فرصه|اخر تنبيه|تنبيه نهائي)/, /(urgent|immediately|within \d+ hours|final notice)/i],
  },
  {
    id: 'prize',
    title: 'وعد بجائزة أو مبلغ',
    detail: 'إذا لم تشارك في مسابقة فلا يمكن أن تفوز بها. الهدف غالبًا سرقة بيانات بطاقتك برسوم "استلام الجائزة".',
    weight: 30,
    patterns: [/(مبروك|ربحت|فزت|جائز|جايز|هدي|سحب)[^.\n]{0,25}(ريال|مبلغ|جائز|جايز|ايفون|سيار|بطاق)/, /(congratulations|you (have )?won|prize|reward)/i],
  },
  {
    id: 'parcel',
    title: 'شحنة معلّقة أو رسوم توصيل',
    detail: 'رسائل "تعذّر توصيل شحنتك، ادفع رسومًا بسيطة" من أشهر أساليب الاحتيال باسم البريد وشركات الشحن.',
    weight: 30,
    patterns: [/(شحن|طرد|طلبي|طلبك)[^.\n]{0,30}(تعذر|معلق|متوقف|رسوم|دفع|سداد)/, /(تعذر|لم نتمكن)[^.\n]{0,20}(توصيل|تسليم)/, /(parcel|package|shipment)[^.\n]{0,30}(fee|pay|held|failed)/i],
  },
  {
    id: 'fine',
    title: 'مخالفة أو غرامة مطلوب سدادها',
    detail: 'المخالفات الحقيقية تُسدّد من أبشر أو تطبيق البنك، وليس من رابط في رسالة.',
    weight: 30,
    patterns: [/(مخالف|غرام|متاخرات|فاتور)[^.\n]{0,30}(سداد|ادفع|دفع|مستحق)/, /(fine|penalty|overdue)[^.\n]{0,20}(pay|due)/i],
  },
  {
    id: 'refund',
    title: 'استرداد مبلغ أو مبلغ مستحق لك',
    detail: 'وعود "لديك مبلغ مسترد" تستدرجك لإدخال بيانات بطاقتك في موقع مزيف.',
    weight: 25,
    patterns: [/(استرداد|استرجاع|مبلغ مستحق|تعويض مالي)/, /\b(refund|compensation)\b/i],
  },
  {
    id: 'investment',
    title: 'أرباح مضمونة أو استثمار سريع',
    detail: 'لا يوجد استثمار بأرباح مضمونة وسريعة. هذه من أكثر عمليات الاحتيال المالي خسارةً.',
    weight: 35,
    patterns: [/(ارباح|ربح|عوائد)[^.\n]{0,20}(مضمون|يومي|اسبوعي|شهري)/, /(تداول|استثمر|عملات رقميه|كريبتو)[^.\n]{0,30}(ربح|ارباح|مضمون)/, /(guaranteed (profit|return)|double your money)/i],
  },
  {
    id: 'call',
    title: 'يطلب الاتصال أو التواصل على رقم',
    detail: 'تحقق من الرقم عبر الموقع الرسمي للجهة قبل الاتصال. المحتالون يتظاهرون بأنهم خدمة عملاء.',
    weight: 15,
    patterns: [/(اتصل|تواصل|راسلنا)[^.\n]{0,15}(على|عبر|بالرقم|واتس)/, /(call|whatsapp)[^.\n]{0,10}(us|now|on)/i],
  },
];

/** Strips diacritics/tatweel and unifies letter variants so patterns match reliably. */
export function normaliseArabic(text: string): string {
  return text
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

/** Finds links in free text, including bare domains like "absher-sa.com/x". */
export function extractLinks(text: string): string[] {
  const re = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s"'<>،]*)?)/gi;
  const links = new Set<string>();
  for (const match of text.matchAll(re)) {
    const link = match[1].replace(/[).,!؟?]+$/, '');
    // Skip things like "e.g" or emails' domain parts.
    if (text[match.index! - 1] === '@') continue;
    links.add(link);
  }
  return [...links];
}

export interface MessageReport extends Report {
  links: { link: string; report: Report }[];
}

export function analyzeMessage(text: string): MessageReport | null {
  if (!text.trim()) return null;
  const normalised = normaliseArabic(text);
  const findings: Finding[] = [];

  for (const p of SCAM_PATTERNS) {
    if (p.patterns.some((re) => re.test(normalised))) {
      findings.push({ severity: p.weight >= 35 ? 'danger' : 'warn', title: p.title, detail: p.detail, weight: p.weight });
    }
  }

  const links = extractLinks(text)
    .map((link) => ({ link, report: analyzeUrl(link) }))
    .filter((l): l is { link: string; report: Report } => l.report !== null);

  const worstLink = links.reduce<Report | null>(
    (worst, l) => (!worst || l.report.score > worst.score ? l.report : worst),
    null,
  );
  if (worstLink && worstLink.verdict !== 'safe') {
    findings.push({
      severity: worstLink.verdict === 'dangerous' ? 'danger' : 'warn',
      title: worstLink.verdict === 'dangerous' ? 'الرسالة تحتوي رابطًا خطيرًا' : 'الرسالة تحتوي رابطًا مشبوهًا',
      detail: 'افحص تفاصيل الرابط بالأسفل، ولا تضغط عليه.',
      weight: worstLink.verdict === 'dangerous' ? 45 : 20,
    });
  }

  // A link combined with pressure tactics is the classic smishing recipe.
  if (links.length && findings.some((f) => f.weight >= 20 && !f.title.includes('رابط'))) {
    findings.push({
      severity: 'warn',
      title: 'رابط مع أسلوب ضغط أو إغراء',
      detail: 'الجمع بين رابط وأسلوب تخويف أو إغراء هو النمط الأشهر لرسائل التصيد.',
      weight: 15,
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      title: 'لا توجد أساليب احتيال معروفة',
      detail: 'لم نجد عبارات أو روابط مشبوهة، لكن تأكد دائمًا من هوية المرسل قبل التجاوب.',
      weight: 0,
    });
  }

  return { ...buildReport(findings), links };
}
