/** Sample scam messages for the awareness section. Domains are fictional. */
export interface Example {
  label: string;
  text: string;
}

export const EXAMPLE_MESSAGES: Example[] = [
  {
    label: 'إيقاف حساب بنكي',
    text: 'عميلنا العزيز، تم إيقاف حسابك مؤقتًا لعدم تحديث البيانات. يرجى التحديث خلال 24 ساعة عبر الرابط: alrajhi-sa.top/update',
  },
  {
    label: 'شحنة معلّقة',
    text: 'سبل: تعذر توصيل شحنتك رقم 88341 بسبب نقص العنوان، يرجى سداد رسوم 9 ريال: https://spl-delivery.icu/pay',
  },
  {
    label: 'مخالفة مرورية',
    text: 'أبشر: لديك مخالفة مرورية غير مسددة بقيمة 300 ريال، سدادها فورًا لتجنب الغرامة: absher-pay.online',
  },
  {
    label: 'طلب رمز التحقق',
    text: 'مرحبًا، معك خدمة عملاء البنك. وصلك رمز على جوالك، أرسل الرمز لنا لإلغاء العملية المشبوهة على بطاقتك.',
  },
  {
    label: 'جائزة وهمية',
    text: 'مبروك! تم اختيار رقمك للفوز بجائزة 50,000 ريال ضمن سحب العملاء. اضغط للاستلام: bit.ly/win-sa',
  },
  {
    label: 'رسالة سليمة',
    text: 'رمز التحقق الخاص بك: 482915. لا تشارك الرمز مع أي شخص.',
  },
];

export const EXAMPLE_LINKS: string[] = [
  'https://alrajhlbank.com/login',
  'https://www.alrajhibank.com.sa',
  'https://bit.ly/3xYz9',
  'http://absher-update.xyz/verify',
  'https://www.my.gov.sa',
];

export const TIPS: { title: string; body: string }[] = [
  { title: 'لا تشارك رمز التحقق أبدًا', body: 'البنوك والجهات الرسمية لا تطلب الرمز السري أو رمز التحقق (OTP) بأي وسيلة.' },
  { title: 'افتح التطبيق الرسمي بنفسك', body: 'بدل الضغط على رابط في رسالة، افتح تطبيق البنك أو أبشر مباشرة وتحقق من أي تنبيه.' },
  { title: 'انظر إلى نهاية اسم الموقع', body: 'الاسم الحقيقي هو ما قبل ".com.sa" أو ".sa" مباشرة. "alrajhibank.com.sa.verify.xyz" موقعه الحقيقي verify.xyz.' },
  { title: 'الاستعجال علامة خطر', body: '"خلال 24 ساعة" و"آخر تنبيه" أساليب ضغط هدفها أن تتصرف قبل أن تفكر.' },
  { title: 'الجوائز التي لم تشارك فيها غير حقيقية', body: 'أي رسالة تطلب رسومًا لاستلام جائزة هي محاولة لسرقة بيانات بطاقتك.' },
  { title: 'بلّغ عن الاحتيال', body: 'إذا شاركت بياناتك بالخطأ، اتصل ببنكك فورًا لإيقاف البطاقة، وبلّغ الجهات المختصة عبر القنوات الرسمية.' },
];
