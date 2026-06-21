import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Coins, Check, Lock, ChevronRight } from 'lucide-react';
import { PlayerProfile, GameSkin, ShopItem } from '../types/game';
import { sound } from '../utils/audio';

interface ShopProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onBack: () => void;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Skins
  {
    id: 'skin_classic',
    name: 'پوسته کلاسیک',
    description: 'ظاهر استاندارد بازی، ساده و دوست‌داشتنی.',
    cost: 0,
    type: 'skin',
    value: 'classic',
    previewColor: 'from-slate-600 to-slate-800 border-slate-500'
  },
  {
    id: 'skin_golden',
    name: 'پوسته لوکس طلایی',
    description: 'درخششی خیره‌کننده از جنس طلا برای قهرمانان واقعی میدان.',
    cost: 250,
    type: 'skin',
    value: 'golden',
    previewColor: 'from-amber-400 to-yellow-600 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
  },
  {
    id: 'skin_fire',
    name: 'پوسته شعله آتشی',
    description: 'شعله‌های گداخته و پرحرارت برای به زانو درآوردن هر حریفی.',
    cost: 500,
    type: 'skin',
    value: 'fire',
    previewColor: 'from-orange-600 to-red-600 border-orange-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
  },
  {
    id: 'skin_cyber',
    name: 'پوسته سایبرپانک',
    description: 'ترکیبی مدرن و آینده‌نگرانه از رنگ‌های صورتی و آبی نئونی.',
    cost: 750,
    type: 'skin',
    value: 'cyber',
    previewColor: 'from-cyan-500 to-fuchsia-500 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
  },
  {
    id: 'skin_hologram',
    name: 'پوسته هولوگرام هوشمند',
    description: 'ظاهری شیشه‌ای، پیشرفته و نیمه‌شفاف شبیه به هوش‌های مصنوعی.',
    cost: 1000,
    type: 'skin',
    value: 'hologram',
    previewColor: 'from-blue-400/80 to-indigo-500/80 border-cyan-300/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
  },

  // Titles
  {
    id: 'title_novice',
    name: 'نوآموز سنگ',
    description: 'عنوانی ساده برای شروع ماجراجویی در کلوپ.',
    cost: 0,
    type: 'title',
    value: 'نوآموز سنگ',
    previewColor: 'bg-slate-800 border-slate-700'
  },
  {
    id: 'title_scissors_soldier',
    name: 'سرباز قیچی',
    description: 'نشان‌دهنده تیزبینی و تصمیم‌های برنده.',
    cost: 100,
    type: 'title',
    value: 'سرباز قیچی',
    previewColor: 'bg-indigo-950/40 border-indigo-900/40'
  },
  {
    id: 'title_paper_shield',
    name: 'مدافع کاغذ',
    description: 'برای کسانی که استراتژی‌های دفاعی هوشمندانه دارند.',
    cost: 180,
    type: 'title',
    value: 'مدافع کاغذ',
    previewColor: 'bg-emerald-950/40 border-emerald-900/40'
  },
  {
    id: 'title_lizard_hunter',
    name: 'شکارچی مار',
    description: 'چابک و آماده برای شکار مارهای موذی در حالت پیشرفته.',
    cost: 250,
    type: 'title',
    value: 'شکارچی مار',
    previewColor: 'bg-green-950/40 border-green-900/40'
  },
  {
    id: 'title_spock_scientist',
    name: 'دانشمند اسپاک',
    description: 'برای ذهن‌های تحلیلی و پیروان علم منطق.',
    cost: 350,
    type: 'title',
    value: 'دانشمند اسپاک',
    previewColor: 'bg-cyan-950/40 border-cyan-900/40'
  },
  {
    id: 'title_street_hero',
    name: 'قهرمان خیابان',
    description: 'مورد احترام در تمامی محله‌ها و کوچه‌های شهر.',
    cost: 500,
    type: 'title',
    value: 'قهرمان خیابان',
    previewColor: 'bg-amber-950/40 border-amber-900/40'
  },
  {
    id: 'title_legend',
    name: 'افسانه بی‌پایان',
    description: 'عنوانی باشکوه که تنها نصیب اسطوره‌ها می‌شود.',
    cost: 800,
    type: 'title',
    value: 'افسانه بی‌پایان',
    previewColor: 'bg-purple-950/40 border-purple-900/40'
  },
  {
    id: 'title_emperor',
    name: 'امپراتور سنگ کاغذ قیچی',
    description: 'فرمانروای مطلق تمام زمین‌ها و صاحب برترین انتخاب‌ها.',
    cost: 1500,
    type: 'title',
    value: 'امپراتور سنگ کاغذ قیچی',
    previewColor: 'bg-rose-950/40 border-rose-900/40'
  }
];

export const Shop: React.FC<ShopProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'title'>('skin');

  const filteredItems = SHOP_ITEMS.filter((item) => item.type === activeTab);

  const handleBuyOrEquip = (item: ShopItem) => {
    sound.playClick();
    
    const isUnlocked =
      item.type === 'skin'
        ? profile.unlockedSkins.includes(item.value as GameSkin)
        : profile.unlockedTitles.includes(item.value);

    if (isUnlocked) {
      // Equip item
      if (item.type === 'skin') {
        onUpdateProfile({ activeSkin: item.value as GameSkin });
      } else {
        onUpdateProfile({ activeTitle: item.value });
      }
    } else {
      // Buy item
      if (profile.coins >= item.cost) {
        const remainingCoins = profile.coins - item.cost;
        if (item.type === 'skin') {
          onUpdateProfile({
            coins: remainingCoins,
            unlockedSkins: [...profile.unlockedSkins, item.value as GameSkin],
            activeSkin: item.value as GameSkin
          });
        } else {
          onUpdateProfile({
            coins: remainingCoins,
            unlockedTitles: [...profile.unlockedTitles, item.value],
            activeTitle: item.value
          });
        }
        sound.playWin(); // play win sound as purchase success
      } else {
        // Not enough coins - play error/lose sound
        sound.playLose();
        alert('سکه‌ کافی نداری! با بردن در بازی‌ها سکه جمع کن.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all"
          >
            <ChevronRight size={20} />
            بازگشت به لابی
          </button>
          <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">فروشگاه تزئینات</h1>
              <p className="text-xs text-slate-400">ظاهر و عنوان خود را در مسابقات متمایز کنید</p>
            </div>
          </div>
        </div>

        {/* Coins Counter */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/20 border border-amber-500/30 rounded-2xl self-start md:self-auto">
          <Coins className="text-amber-400 animate-pulse" size={22} />
          <span className="text-slate-400 text-sm">موجودی سکه شما:</span>
          <span className="text-amber-300 font-black text-xl">{profile.coins}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/50 mb-8 max-w-sm">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('skin');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'skin'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles size={16} />
          پوسته‌های دست
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('title');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'title'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ShoppingBag size={16} />
          عنوان‌های حماسی
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => {
          const isSkin = item.type === 'skin';
          const isUnlocked = isSkin
            ? profile.unlockedSkins.includes(item.value as GameSkin)
            : profile.unlockedTitles.includes(item.value);
          const isActive = isSkin
            ? profile.activeSkin === item.value
            : profile.activeTitle === item.value;

          return (
            <div
              key={item.id}
              className={`relative bg-slate-900/40 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 ${
                isActive
                  ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.15)] bg-indigo-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-3 right-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg">
                  مجهز شده
                </div>
              )}

              <div className="flex gap-4">
                {/* Visual Preview */}
                {isSkin ? (
                  <div
                    className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-tr ${item.previewColor} border-2 flex items-center justify-center text-4xl`}
                  >
                    ✊
                  </div>
                ) : (
                  <div
                    className={`w-20 h-20 shrink-0 rounded-2xl border ${item.previewColor} flex items-center justify-center text-center p-2 text-xs font-bold text-slate-300`}
                  >
                    🏆 {item.name.split(' ')[0]}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <h3 className="text-white font-bold text-base flex items-center gap-1.5">
                    {item.name}
                    {item.cost === 0 && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-normal">
                        رایگان
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                  
                  {!isSkin && (
                    <span className="inline-block text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50 font-mono mt-1">
                      نمایش: {item.value}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between border-t border-slate-800/50 pt-4 mt-2">
                <div className="flex items-center gap-1">
                  {!isUnlocked && item.cost > 0 && (
                    <>
                      <Coins size={16} className="text-amber-400" />
                      <span className="text-amber-400 font-black text-sm">{item.cost}</span>
                      <span className="text-[10px] text-slate-400 mr-1">سکه</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleBuyOrEquip(item)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : isUnlocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 active:scale-95'
                      : profile.coins >= item.cost
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 active:scale-95 font-extrabold'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30'
                  }`}
                  disabled={isActive}
                >
                  {isActive ? (
                    <>
                      <Check size={14} />
                      مجهز شده
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Check size={14} />
                      تجهیز و استفاده
                    </>
                  ) : profile.coins >= item.cost ? (
                    <>
                      <ShoppingBag size={14} />
                      خرید پوسته
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      سکه ناکافی
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
