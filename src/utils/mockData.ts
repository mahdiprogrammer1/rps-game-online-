import { LeaderboardEntry } from '../types/game';

export const AVATARS = [
  '🦖', '🦊', '🦁', '🦉', '🥷', '🦄', '🐼', '🤖', '👾', '👑', 
  '⚡', '🔥', '🐉', '🐯', '🐧', '🧙‍♂️', '🧜‍♀️', '🤠', '👽', '💀'
];

export const OPPONENTS = [
  { name: 'سینا_حرفه‌ای', avatar: '🥷', title: 'سرباز قیچی', skill: 'predictive', talkative: 0.8 },
  { name: 'سارا_تک', avatar: '🦊', title: 'مدافع کاغذ', skill: 'aggressive', talkative: 0.9 },
  { name: 'استاد_سنگ', avatar: '🧙‍♂️', title: 'امپراتور سنگ', skill: 'rock_heavy', talkative: 0.4 },
  { name: 'ربات_کوانتومی', avatar: '🤖', title: 'هوش برتر', skill: 'predictive', talkative: 0.2 },
  { name: 'امیر_سنگپر', avatar: '🦁', title: 'قهرمان خیابان', skill: 'random', talkative: 0.75 },
  { name: 'الناز_سریع', avatar: '⚡', title: 'افسانه بی‌پایان', skill: 'scissors_heavy', talkative: 0.85 },
  { name: 'پویا_کامبت', avatar: '🐉', title: 'نوآموز سنگ', skill: 'random', talkative: 0.6 }
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { username: 'سلطان_سنگ', wins: 245, xp: 24500, title: 'امپراتور سنگ کاغذ قیچی', avatar: '👑', isOnline: true },
  { username: 'ملکه_کاغذ', wins: 210, xp: 21000, title: 'افسانه بی‌پایان', avatar: '🥷', isOnline: true },
  { username: 'قیچی_تیز', wins: 189, xp: 18900, title: 'افسانه بی‌پایان', avatar: '⚡', isOnline: false },
  { username: 'سارا_تک', wins: 154, xp: 15400, title: 'مدافع کاغذ', avatar: '🦊', isOnline: true },
  { username: 'حسین_پرو', wins: 142, xp: 14200, title: 'قهرمان خیابان', avatar: '🐼', isOnline: true },
  { username: 'ربات_کوانتومی', wins: 130, xp: 13000, title: 'هوش برتر', avatar: '🤖', isOnline: true },
  { username: 'بردیا_آر‌پی‌اس', wins: 115, xp: 11500, title: 'سرباز قیچی', avatar: '👾', isOnline: false },
  { username: 'الناز_سریع', wins: 98, xp: 9800, title: 'قهرمان خیابان', avatar: '⚡', isOnline: true },
  { username: 'سهراب_سنگین', wins: 87, xp: 8700, title: 'نوآموز سنگ', avatar: '🐗', isOnline: false },
  { username: 'ممد_سنگپر', wins: 76, xp: 7600, title: 'نوآموز سنگ', avatar: '🦖', isOnline: true }
];

export const GLOBAL_CHAT_POOL = [
  { username: 'سلطان_سنگ', message: 'کی میاد بازی؟ من آماده‌ام! ✊', avatar: '👑' },
  { username: 'ملکه_کاغذ', message: 'پوست سایبرپانک رو خریدم، افکتش بی‌نظیره! 😍', avatar: '🥷' },
  { username: 'حسین_پرو', message: 'کسی پایه هست ۵ دستی سنگ کاغذ قیچی بزنیم؟ 🏆', avatar: '🐼' },
  { username: 'بردیا_آر‌پی‌اس', message: 'ربات پیش‌بینی‌کننده خیلی سخته، همش دستمو می‌خونه 🤯', avatar: '👾' },
  { username: 'سارا_تک', message: 'قیچی همیشه از همه زرنگ‌تره ✌️ مگه نه؟', avatar: '🦊' },
  { username: 'الناز_سریع', message: 'آخیش بالاخره رفتم رتبه ۴ جدول! 🚀', avatar: '⚡' },
  { username: 'ممد_سنگپر', message: 'عجب بازی نفس‌گیری با سهراب داشتم، ثانیه آخر بردم! 😅', avatar: '🦖' },
  { username: 'سهراب_سنگین', message: 'ممد شانس آوردی وگرنه دست آخر کاغذ می‌آوردم باخته بودی 😂', avatar: '🐗' },
  { username: 'پویا_کامبت', message: 'سلام بچه‌ها، بازی دو نفره واقعی چطوریه؟ 🎮', avatar: '🐉' },
  { username: 'ملکه_کاغذ', message: 'کافیه دکمه "بازی با دوست" رو بزنی، لینک رو کپی کنی بفرستی واسش 🔗', avatar: '🥷' },
  { username: 'پویا_کامبت', message: 'دمت گرم چه راحت! الان تست می‌کنم 👌', avatar: '🐉' },
  { username: 'سلطان_سنگ', message: 'سنگ همیشه بهترین انتخابه. شک نکنید! ✊🔥', avatar: '👑' },
  { username: 'حسین_پرو', message: 'من با فرمول احتمالاتی بازی می‌کنم، برد حتمیه 😎', avatar: '🐼' },
  { username: 'الناز_سریع', message: 'کی حریف منه؟ بیاد تو صف انتظار! ⚡👊', avatar: '⚡' }
];

export const CHAT_OPPONENT_RESPONSES = {
  start: [
    'سلام! بازی خوبی داشته باشیم 🤝',
    'ببینیم کی قهرمانه! 😎',
    'آماده باختن باش دوست من! 😉',
    'سلام! امیدوارم بازی هیجان‌انگیزی بشه ✌️',
    'سنگ کاغذ قیچی... بزن بریم!'
  ],
  winRound: [
    'هورا! این راند مال من بود 🥳',
    'دیدی؟ دستت رو خوندم! 🧠',
    'آخیش! یک بر صفر به نفع من 😎',
    'شانس با من یار بود! 😉',
    'عالی بود ولی من بردم ✌️',
    'ایول! یکی جلو افتادم'
  ],
  loseRound: [
    'آخ! چه حرکتی، آفرین 😳',
    'ایول، این راند رو خوب زدی 👏',
    'شانسی بود! راند بعدی جبران می‌کنم 😜',
    'عجب تصمیمی! غافلگیر شدم 🤯',
    'دست مریزاد! بازیت خوبه ها 👍',
    'اوه، حواسم نبود!'
  ],
  draw: [
    'تفکر مشابه! 😄 دوباره بزنیم',
    'عجب تفاهمی! 🤝',
    'مثل هم فکر می‌کنیم! 🧠',
    'ای بابا، مساوی شد! دوباره 👊',
    'جالب شد، تکرار راند!'
  ],
  winMatch: [
    'جییییییغ! بالاخره بردم 🏆 بازی فوق‌العاده‌ای بود!',
    'مرسی بابت بازی! واقعاً عالی بازی کردی 🤝🌹',
    'هوراااا! من قهرمان این میدونم 👑',
    'بازی سختی بود ولی تجربه برنده شد! 😉👋',
    'دمت گرم، واقعاً لذت بردم.'
  ],
  loseMatch: [
    'تبریک میگم! قهرمانی حق تو بود 👑❤️',
    'وااای! خیلی نزدیک بود. دمت گرم بازی عالی‌ای بود 👍',
    'انتقام می‌گیرم! بازی بعدی مال منه 😉👊',
    'عالی بودی پسر/دختر! کاملاً غافلگیر شدم 👋',
    'شکست سختی بود، ولی واقعاً لذت بردم!'
  ],
  emojis: ['👍', '🔥', '😎', '🎉', '🤯', '😜', '👏', '😂', '🥺', '😡']
};
