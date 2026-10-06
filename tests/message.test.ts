import { describe, expect, it } from 'vitest';
import { analyzeMessage, extractLinks, normaliseArabic } from '../src/analyzer/message';

const verdict = (t: string) => analyzeMessage(t)?.verdict;

describe('analyzeMessage', () => {
  it('flags a fake bank suspension message with a link as dangerous', () => {
    const r = analyzeMessage('عميلنا العزيز، تم إيقاف حسابك مؤقتًا. يرجى تحديث بياناتك خلال 24 ساعة عبر الرابط: alrajhi-sa.top/update')!;
    expect(r.verdict).toBe('dangerous');
    expect(r.links).toHaveLength(1);
    expect(r.links[0].report.verdict).toBe('dangerous');
  });

  it('flags requests to send the OTP', () => {
    expect(verdict('مرحبا، معك خدمة العملاء، أرسل الرمز الذي وصلك لإكمال التحقق')).toBe('dangerous');
  });

  it('recognises Saudi Post impersonation in parcel links', () => {
    const r = analyzeMessage('تعذر توصيل شحنتك: https://spl-delivery.icu/pay')!;
    expect(r.links[0].report.findings.some((f) => f.title.includes('سبل'))).toBe(true);
  });

  it('flags fake parcel fee messages', () => {
    expect(verdict('سبل: تعذر توصيل شحنتك، يرجى سداد رسوم 9 ريال: https://spl-delivery.icu/pay')).toBe('dangerous');
  });

  it('flags prize scams', () => {
    expect(verdict('مبروك! ربحت جائزة 50,000 ريال، اضغط هنا للاستلام bit.ly/x1')).not.toBe('safe');
  });

  it('does not flag a genuine OTP message that warns not to share the code', () => {
    expect(verdict('رمز التحقق: 482915. لا تشارك الرمز مع أي شخص.')).toBe('safe');
    expect(verdict('Your code is 482915. Do not share this code with anyone.')).toBe('safe');
  });

  it('does not flag ordinary messages', () => {
    expect(verdict('هلا، متى نتقابل بكرة؟')).toBe('safe');
  });

  it('returns null for empty text', () => {
    expect(analyzeMessage('   ')).toBeNull();
  });
});

describe('helpers', () => {
  it('extracts bare and full links but not emails', () => {
    expect(extractLinks('زوروا absher.sa أو https://my.gov.sa/x. للتواصل: a@b.com')).toEqual([
      'absher.sa',
      'https://my.gov.sa/x',
    ]);
  });

  it('normalises Arabic letter variants', () => {
    expect(normaliseArabic('إيقاف الحسابـــات')).toBe('ايقاف الحسابات');
  });
});
