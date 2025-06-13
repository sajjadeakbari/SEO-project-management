import { TabDefinition, TasksState, FilterSettings } from './types';
// Filter/Sort option arrays are now defined in types.ts for better co-location with their types
// and exported from there. We just define the default settings object here.

export const TAB_DEFINITIONS: TabDefinition[] = [
  { id: 'start', label: 'شروع پروژه', title: 'روند شروع پروژه سئو' },
  { id: 'daily', label: 'روزانه', title: 'کارهای روزانه' },
  { id: 'weekly', label: 'هفتگی', title: 'کارهای هفتگی' },
  { id: 'monthly', label: 'ماهانه', title: 'کارهای ماهانه' },
  { id: 'completed', label: 'گزارشات', title: 'گزارشات و خلاصه پیشرفت' }, // Updated title
];

export const INITIAL_TASKS: TasksState = {
  start: [
    { id: 's1', text: 'همسوسازی اهداف سئو با اهداف تجاری.', completed: false },
    { id: 's2', text: 'تعریف شاخص‌های کلیدی عملکرد (KPIs) قابل اندازه‌گیری.', completed: false },
    { id: 's3', text: 'نصب و پیکربندی Google Analytics 4.', completed: false },
    { id: 's4', text: 'ثبت و تایید سایت در Google Search Console.', completed: false },
    { id: 's5', text: 'پیکربندی ردیابی اهداف و رویدادها (Conversions) در GA4.', completed: false },
    { id: 's6', text: 'ثبت معیارهای اولیه (Baseline) ترافیک و رتبه.', completed: false },
    { id: 's7', text: 'راه‌اندازی ابزار ردیابی رتبه کلمات کلیدی.', completed: false },
    { id: 's8', text: 'اجرای ممیزی فنی اولیه برای شناسایی مشکلات حیاتی.', completed: false },
    { id: 's9', text: 'بررسی و بهینه‌سازی فایل robots.txt.', completed: false },
    { id: 's10', text: 'بررسی صحت و ارسال نقشه سایت XML.', completed: false },
    { id: 's11', text: 'ارزیابی وضعیت نمایش سایت در موبایل (Mobile-Friendliness).', completed: false },
    { id: 's12', text: 'اندازه‌گیری سرعت اولیه سایت و Core Web Vitals.', completed: false },
    { id: 's13', text: 'بررسی وضعیت ایندکس صفحات اصلی در GSC.', completed: false },
    { id: 's14', text: 'بررسی وجود جریمه‌های دستی (Manual Actions) در GSC.', completed: false },
    { id: 's15', text: 'شناسایی مشکلات محتوای تکراری (Duplicate Content).', completed: false },
    { id: 's16', text: 'تحلیل ساختار سایت و معماری اطلاعات.', completed: false },
    { id: 's17', text: 'تعریف پرسونای مخاطب هدف.', completed: false },
    { id: 's18', text: 'شناسایی رقبای اصلی در نتایج جستجو (SERP).', completed: false },
    { id: 's19', text: 'تحقیق کلمات کلیدی اولیه (Seed Keywords).', completed: false },
    { id: 's20', text: 'گسترش لیست کلمات کلیدی و یافتن عبارات طولانی (Long-tail).', completed: false },
    { id: 's21', text: 'تحلیل و دسته‌بندی کلمات کلیدی بر اساس قصد کاربر (Search Intent).', completed: false },
    { id: 's22', text: 'تحلیل کلی قدرت دامنه و پروفایل بک‌لینک رقبا.', completed: false },
    { id: 's23', text: 'بررسی استراتژی محتوایی و موضوعات اصلی رقبا.', completed: false },
    { id: 's24', text: 'تحلیل شکاف کلمات کلیدی (Keyword Gap) با رقبا.', completed: false },
    { id: 's25', text: 'ممیزی عناصر سئو داخلی (On-Page) صفحات کلیدی.', completed: false },
    { id: 's26', text: 'ایجاد نقشه کلمات کلیدی به صفحات (Keyword Mapping).', completed: false },
    { id: 's27', text: 'ممیزی پروفایل بک‌لینک فعلی سایت.', completed: false },
    { id: 's28', text: 'شناسایی بک‌لینک‌های مخرب یا بی‌کیفیت.', completed: false },
    { id: 's29', text: 'طراحی تقویم محتوایی اولیه.', completed: false },
    { id: 's30', text: 'ایجاد چارچوب گزارش‌دهی ماهانه برای ذی‌نفعان.', completed: false },
  ],
  daily: [
    { id: 'd1', text: 'بررسی ایندکس سایت', completed: false },
    { id: 'd2', text: 'بررسی گزارشات سرچ کنسول', completed: false },
  ],
  weekly: [
    { id: 'w1', text: 'بررسی بک‌لینک‌ها', completed: false },
    { id: 'w2', text: 'آنالیز رتبه‌بندی کلمات کلیدی', completed: false },
  ],
  monthly: [
    { id: 'm1', text: 'تحلیل کلی رقبا', completed: false },
    { id: 'm2', text: 'تهیه گزارش عملکرد', completed: false },
  ],
  completed: [ // These are tasks related to the reporting process itself
    { id: 'c1', text: 'گردآوری داده‌های عملکرد ماهانه', completed: false },
    { id: 'c2', text: 'تهیه پیش‌نویس گزارش ماهانه', completed: false },
    { id: 'c3', text: 'ارسال گزارش به کارفرما و دریافت بازخورد', completed: false },
  ],
};


export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  status: 'all',
  priority: 'all',
  sortBy: 'default',
  sortDirection: 'asc',
  searchTerm: '',
};

// Types like FilterStatusValue, FilterPriorityValue, SortByValue are now directly exported from types.ts
// STATUS_FILTER_OPTIONS, PRIORITY_FILTER_OPTIONS, SORT_BY_OPTIONS are also now defined and exported from types.ts
