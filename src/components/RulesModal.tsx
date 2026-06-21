import React from 'react';
import { X, HelpCircle, Shield, Zap, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">راهنمای بازی سنگ کاغذ قیچی</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Classic Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg border-b border-amber-400/20 pb-2">
              <Shield size={20} />
              <h3>حالت کلاسیک (Classic Mode)</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              قوانین بسیار ساده و کلاسیک که همه ما از بچگی با آن خاطره داریم. در این حالت ۳ نماد وجود دارد:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center flex flex-col items-center">
                <span className="text-4xl mb-2">✊</span>
                <span className="font-bold text-white mb-1">سنگ</span>
                <span className="text-xs text-slate-400">قیچی را له می‌کند، اما از کاغذ شکست می‌خورد.</span>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center flex flex-col items-center">
                <span className="text-4xl mb-2">✋</span>
                <span className="font-bold text-white mb-1">کاغذ</span>
                <span className="text-xs text-slate-400">سنگ را می‌پوشاند، اما از قیچی شکست می‌خورد.</span>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-center flex flex-col items-center">
                <span className="text-4xl mb-2">✌️</span>
                <span className="font-bold text-white mb-1">قیچی</span>
                <span className="text-xs text-slate-400">کاغذ را می‌برد، اما از سنگ شکست می‌خورد.</span>
              </div>
            </div>
          </div>

          {/* Advanced Rules (Lizard Spock) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-lg border-b border-purple-400/20 pb-2">
              <Sparkles size={20} />
              <h3>حالت پیشرفته (Lizard & Spock)</h3>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              این نسخه ابتدا توسط سم کاس و کارن روبلا اختراع شد و در سریال محبوب «تئوری بیگ بنگ» معرفی شد. اضافه شدن دو نماد 🦎 (مار) و 🖖 (اسپاک)، احتمال مساوی شدن را به شدت کاهش داده و استراتژی‌های جدیدی اضافه می‌کند!
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 text-center">
                <span className="text-3xl block mb-1">✊</span>
                <span className="font-bold text-xs text-white">سنگ</span>
                <span className="text-[10px] text-slate-400 block mt-1">له می‌کند: ✌️، 🦎</span>
              </div>
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 text-center">
                <span className="text-3xl block mb-1">✋</span>
                <span className="font-bold text-xs text-white">کاغذ</span>
                <span className="text-[10px] text-slate-400 block mt-1">پوشش می‌دهد: ✊، 🖖</span>
              </div>
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 text-center">
                <span className="text-3xl block mb-1">✌️</span>
                <span className="font-bold text-xs text-white">قیچی</span>
                <span className="text-[10px] text-slate-400 block mt-1">می‌برد: ✋، 🦎</span>
              </div>
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 text-center">
                <span className="text-3xl block mb-1">🦎</span>
                <span className="font-bold text-xs text-white">مار</span>
                <span className="text-[10px] text-slate-400 block mt-1">مسموم/می‌خورد: 🖖، ✋</span>
              </div>
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-900/30 text-center">
                <span className="text-3xl block mb-1">🖖</span>
                <span className="font-bold text-xs text-white">اسپاک</span>
                <span className="text-[10px] text-slate-400 block mt-1">تبخیر/می‌شکند: ✊، ✌️</span>
              </div>
            </div>

            {/* Relations list */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">قیچی ✌️</strong> کاغذ ✋ را می‌برد.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">کاغذ ✋</strong> سنگ ✊ را می‌پوشاند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">سنگ ✊</strong> مار 🦎 را له می‌کند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">مار 🦎</strong> اسپاک 🖖 را مسموم می‌کند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">اسپاک 🖖</strong> قیچی ✌️ را می‌شکند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">قیچی ✌️</strong> مار 🦎 را سر می‌برد.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">مار 🦎</strong> کاغذ ✋ را می‌خورد.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">کاغذ ✋</strong> اسپاک 🖖 را باطل می‌کند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">اسپاک 🖖</strong> سنگ ✊ را تبخیر می‌کند.</div>
              <div className="flex items-center gap-1">🔹 <strong className="text-slate-200">سنگ ✊</strong> قیچی ✌️ را خرد می‌کند.</div>
            </div>
          </div>
          
          {/* Scoring & Coins */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-4 items-start">
            <Zap className="text-amber-400 shrink-0" size={24} />
            <div className="space-y-1">
              <h4 className="text-white font-bold text-sm">جوایز و سکه‌ها</h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                با شکست دادن حریفان در بخش تک‌نفره یا رقابت آنلاین، سکه و امتیاز تجربه (XP) کسب می‌کنید. از سکه‌های خود می‌توانید در <strong className="text-amber-400">فروشگاه</strong> برای باز کردن پوسته‌های نئونی دست‌ها (طلایی، آتشی، سایبرپانک و هولوگرامی) و عنوان‌های کاربری حماسی استفاده کنید!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
          >
            فهمیدم، بریم بازی!
          </button>
        </div>
      </div>
    </div>
  );
};
