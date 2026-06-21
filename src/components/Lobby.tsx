import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Users, Gamepad2, Volume2, VolumeX, 
  HelpCircle, ShoppingBag, Send, Copy, Link, Cpu, 
  Laptop, Plus, Play, Check, Edit2, Crown, AlertCircle 
} from 'lucide-react';
import { PlayerProfile, GameMode, OpponentType } from '../types/game';
import { INITIAL_LEADERBOARD, GLOBAL_CHAT_POOL, AVATARS, OPPONENTS } from '../utils/mockData';
import { sound } from '../utils/audio';

interface LobbyProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: Partial<PlayerProfile>) => void;
  onStartGame: (
    mode: GameMode, 
    opponentType: OpponentType, 
    rounds: number, 
    opponentInfo?: { name: string; avatar: string; title: string; skill?: string },
    peerConnection?: any,
    roomId?: string
  ) => void;
  onOpenShop: () => void;
  onOpenRules: () => void;
  activeRoomIdFromUrl: string | null;
  peerObject: any;
  peerId: string;
  peerLoading: boolean;
  peerError: string | null;
  onInitPeer: () => void;
  onConnectToPeer: (targetId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  profile,
  onUpdateProfile,
  onStartGame,
  onOpenShop,
  onOpenRules,
  activeRoomIdFromUrl,
  peerObject,
  peerId,
  peerLoading,
  peerError,
  onInitPeer,
  onConnectToPeer
}) => {
  // Sound Muted state
  const [muted, setMuted] = useState(sound.isMuted());
  
  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);

  // Matchmaking states
  const [isMatching, setIsMatching] = useState(false);
  const [matchingTime, setMatchingTime] = useState(0);
  
  // Custom Room states
  const [showP2PModal, setShowP2PModal] = useState(false);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [p2pMode, setP2pMode] = useState<'selection' | 'create' | 'join'>('selection');

  // Solo/AI States
  const [selectedBotIndex, setSelectedBotIndex] = useState(0);
  const [soloRounds, setSoloRounds] = useState(3);
  const [showSoloModal, setShowSoloModal] = useState(false);

  // Global Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Calculate Level
  const playerLevel = Math.floor(profile.xp / 1000) + 1;
  const xpProgress = (profile.xp % 1000) / 10; // percentage

  // Handle URL Room Auto-Join
  useEffect(() => {
    if (activeRoomIdFromUrl && !peerObject && !peerLoading) {
      onInitPeer();
    }
  }, [activeRoomIdFromUrl]);

  useEffect(() => {
    if (activeRoomIdFromUrl && peerId) {
      // If we are initialized and have a room ID from the URL, automatically open the P2P modal in Join mode
      setShowP2PModal(true);
      setP2pMode('join');
      setTargetRoomId(activeRoomIdFromUrl);
    }
  }, [activeRoomIdFromUrl, peerId]);

  // Load Initial Chats
  useEffect(() => {
    // Take 5 random chats from pool to start
    const shuffled = [...GLOBAL_CHAT_POOL].sort(() => 0.5 - Math.random());
    const initial = shuffled.slice(0, 5).map((chat, index) => ({
      id: `init_${index}`,
      ...chat,
      time: new Date(Date.now() - (5 - index) * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }));
    setChatMessages(initial);
  }, []);

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Periodic Simulated Chat Messages
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random message from pool
      const randomChat = GLOBAL_CHAT_POOL[Math.floor(Math.random() * GLOBAL_CHAT_POOL.length)];
      // Avoid repeating the same sender in adjacent messages if possible
      const newMsg = {
        id: `sim_${Date.now()}`,
        username: randomChat.username,
        message: randomChat.message,
        avatar: randomChat.avatar,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev.slice(-30), newMsg]); // Keep last 30 messages
    }, 12000); // Every 12 seconds

    return () => clearInterval(interval);
  }, []);

  // Matchmaking Timer & Simulation
  useEffect(() => {
    let interval: any;
    if (isMatching) {
      sound.playTick();
      interval = setInterval(() => {
        setMatchingTime(t => {
          const nextTime = t + 1;
          
          // Match found after 3 to 6 seconds randomly
          const triggerTime = 4 + Math.floor(Math.random() * 3);
          if (nextTime >= triggerTime) {
            clearInterval(interval);
            handleMatchFound();
            return 0;
          }
          
          sound.playTick();
          return nextTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMatching]);

  // Handle Mute Toggle
  const toggleMute = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    sound.playClick();
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (editName.trim().length < 3) {
      alert('نام کاربری باید حداقل ۳ حرف باشد.');
      return;
    }
    onUpdateProfile({
      username: editName.trim(),
      avatar: editAvatar
    });
    setIsEditingProfile(false);
    sound.playWin();
  };

  // Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    sound.playChat();
    const myMsg = {
      id: `user_${Date.now()}`,
      username: profile.username,
      message: newMsgText.trim(),
      avatar: profile.avatar,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setChatMessages(prev => [...prev, myMsg]);
    setNewMsgText('');

    // Simulated reply after 2-4 seconds
    setTimeout(() => {
      const replies = [
        'ایول داداش! ✌️',
        'چطوری قهرمان؟ بازی کنیم؟ 🎮',
        'کی میاد مسابقه؟ ✊✊',
        'پوسته دستت چیه؟',
        'سنگ کاغذ قیچی فقط با اسپاک باحاله! 🖖',
        'خوش اومدی به کلوپ 🌹'
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const responders = GLOBAL_CHAT_POOL.filter(c => c.username !== profile.username);
      const responder = responders[Math.floor(Math.random() * responders.length)];

      const botReply = {
        id: `reply_${Date.now()}`,
        username: responder.username,
        avatar: responder.avatar,
        message: `@${profile.username} ${randomReply}`,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, botReply]);
      sound.playChat();
    }, 2000 + Math.random() * 2000);
  };

  // Start Quick Match Queue
  const startQuickMatch = () => {
    sound.playClick();
    setIsMatching(true);
    setMatchingTime(0);
  };

  const cancelQuickMatch = () => {
    sound.playClick();
    setIsMatching(false);
  };

  const handleMatchFound = () => {
    setIsMatching(false);
    sound.playMatchFound();
    
    // Choose a random opponent from list
    const randomOpp = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
    
    // Start game
    onStartGame('quick', 'bot_quick', 3, {
      name: randomOpp.name,
      avatar: randomOpp.avatar,
      title: randomOpp.title,
      skill: randomOpp.skill
    });
  };

  // Start Practice Match
  const startSoloMatch = () => {
    sound.playClick();
    setShowSoloModal(false);
    const bot = OPPONENTS[selectedBotIndex];
    onStartGame('solo', bot.skill as any, soloRounds, {
      name: bot.name,
      avatar: bot.avatar,
      title: bot.title,
      skill: bot.skill
    });
  };

  // Start Local Match
  const startLocalMatch = () => {
    sound.playClick();
    onStartGame('local', 'local_player', 3, {
      name: 'بازیکن ۲',
      avatar: '👥',
      title: 'رقیب محلی'
    });
  };

  // Copy P2P Room Link
  const copyRoomLink = () => {
    sound.playClick();
    const link = `${window.location.origin}${window.location.pathname}?room=${peerId}`;
    navigator.clipboard.writeText(link);
    alert('لینک دعوت کپی شد! آن را برای دوست خود بفرستید تا مستقیماً وارد بازی شود.');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        
        {/* Profile Details */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl border-2 border-indigo-500/50 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/10">
              {profile.avatar}
            </div>
            <button 
              onClick={() => { sound.playClick(); setIsEditingProfile(true); }}
              className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg border border-slate-950 transition-colors"
            >
              <Edit2 size={12} />
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">{profile.username}</span>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-mono">
                سطح {playerLevel}
              </span>
            </div>
            <div className="text-xs text-indigo-400 font-bold flex items-center gap-1">
              <Crown size={14} className="text-amber-400" />
              {profile.activeTitle}
            </div>
            {/* XP progress bar */}
            <div className="w-48 space-y-1">
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                <span>پیشرفت سطح</span>
                <span>{profile.xp % 1000} / ۱۰۰۰ XP</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {/* Coins Display */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl font-black text-sm">
            <span>🪙</span>
            <span>{profile.coins}</span>
            <span className="text-[10px] text-amber-400/80 font-normal">سکه</span>
          </div>

          <button
            onClick={() => { sound.playClick(); onOpenShop(); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/50 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="فروشگاه تزئینات"
          >
            <ShoppingBag size={18} className="text-amber-400" />
            فروشگاه
          </button>

          <button
            onClick={() => { sound.playClick(); onOpenRules(); }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/50 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="راهنمای قوانین"
          >
            <HelpCircle size={18} className="text-indigo-400" />
            قوانین
          </button>

          <button
            onClick={toggleMute}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/50 transition-colors"
            title={muted ? 'روشن کردن صدا' : 'قطع صدا'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Main Grid: Game Modes (Left) & Chat/Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Play Options */}
        <div className="lg:col-span-2 space-y-6">
          
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Gamepad2 className="text-indigo-500" />
            حالت‌های بازی
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Quick Match Card */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/60 border border-indigo-500/20 hover:border-indigo-500/40 rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="space-y-2 relative">
                <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-2">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-black text-white">رقابت آنلاین سریع</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  فورا وارد صف انتظار شوید و با بازیکنان آنلاین به صورت ۳ راندی رقابت کنید. برای برنده شدن جایزه نقدی سکه دریافت می‌کنید!
                </p>
              </div>
              <button
                onClick={startQuickMatch}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] relative z-10"
              >
                شروع بازی آنلاین سریع
              </button>
            </div>

            {/* P2P Multiplayer (Play with Friend) */}
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="space-y-2 relative">
                <div className="inline-flex p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 mb-2">
                  <Link size={24} />
                </div>
                <h3 className="text-lg font-black text-white">بازی با دوست (آنلاین واقعی)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  یک اتاق اختصاصی آنلاین بسازید، لینک را کپی کنید و برای دوست خود بفرستید تا بدون نیاز به ثبت‌نام با هم رقابت کنید!
                </p>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowP2PModal(true);
                  if (!peerObject && !peerLoading) {
                    onInitPeer();
                  }
                }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98] relative z-10"
              >
                دعوت از دوست / اتصال
              </button>
            </div>

            {/* Solo Practice (AI) */}
            <div className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-lg transition-all duration-300">
              <div className="space-y-2">
                <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 mb-2">
                  <Cpu size={24} />
                </div>
                <h3 className="text-lg font-black text-white">تمرین با قهرمانان ربات</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  با ربات‌های هوشمند با مهارت‌های مختلف (تصادفی، سنگی، یا ربات نابغه پیش‌بینی‌کننده که حرکات شما را آنالیز می‌کند) رقابت کنید.
                </p>
              </div>
              <button
                onClick={() => { sound.playClick(); setShowSoloModal(true); }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700/50 transition-all active:scale-[0.98]"
              >
                انتخاب ربات و شروع تمرین
              </button>
            </div>

            {/* Local Play (Same Screen) */}
            <div className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden group shadow-lg transition-all duration-300">
              <div className="space-y-2">
                <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 mb-2">
                  <Laptop size={24} />
                </div>
                <h3 className="text-lg font-black text-white">بازی دو نفره روی یک گوشی/سیستم</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  بدون نیاز به اینترنت، با دوست خود در یک دستگاه بازی کنید. بازی به نوبت مخفی می‌شود تا دست یکدیگر را نبینید!
                </p>
              </div>
              <button
                onClick={startLocalMatch}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700/50 transition-all active:scale-[0.98]"
              >
                شروع بازی دو نفره محلی
              </button>
            </div>

          </div>

          {/* Player Stats card */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6">
            <h3 className="text-white font-bold text-sm mb-4">آمار بازی‌های شما</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">تعداد بردها</span>
                <span className="text-emerald-400 font-black text-xl">{profile.wins}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">تعداد باخت‌ها</span>
                <span className="text-rose-400 font-black text-xl">{profile.losses}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">درصد برد</span>
                <span className="text-indigo-400 font-black text-xl">
                  {profile.wins + profile.losses > 0 
                    ? `${Math.round((profile.wins / (profile.wins + profile.losses)) * 100)}%` 
                    : '۰%'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Global Chat & Leaderboard */}
        <div className="space-y-6">
          
          {/* Chat Container */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 flex flex-col h-[380px] shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <h3 className="text-white font-bold text-sm">چت‌روم عمومی لابی</h3>
              <span className="text-[10px] text-slate-400 mr-auto">سیستم چت آنلاین</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2 max-w-[85%] ${msg.isSelf ? 'mr-auto flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    {msg.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`font-bold text-[10px] ${msg.isSelf ? 'text-indigo-400' : 'text-slate-300'}`}>
                        {msg.username}
                      </span>
                      <span className="text-[9px] text-slate-500">{msg.time}</span>
                    </div>
                    <div className={`p-2.5 rounded-2xl leading-relaxed text-slate-200 ${
                      msg.isSelf 
                        ? 'bg-indigo-600/95 text-white rounded-tr-none' 
                        : 'bg-slate-800/85 rounded-tl-none border border-slate-700/30'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                placeholder="پیامی بنویسید..."
                className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none placeholder:text-slate-600 transition-colors"
                maxLength={80}
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Leaderboard Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-3">
              <Trophy className="text-amber-400" size={18} />
              جدول رده‌بندی برترین‌ها
            </h3>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {INITIAL_LEADERBOARD.map((user, index) => {
                const isMe = user.username === profile.username;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isMe 
                        ? 'bg-indigo-950/20 border-indigo-500/50' 
                        : 'bg-slate-950/40 border-slate-900 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank badge */}
                      <span className={`w-5 h-5 flex items-center justify-center rounded-md font-black text-[10px] ${
                        index === 0 ? 'bg-amber-400 text-slate-950' : 
                        index === 1 ? 'bg-slate-300 text-slate-950' :
                        index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>

                      <span className="text-lg">{user.avatar}</span>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${isMe ? 'text-indigo-400' : 'text-slate-200'}`}>
                            {user.username}
                          </span>
                          {user.isOnline && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="آنلاین"></span>
                          )}
                        </div>
                        <span className="text-[8px] text-slate-500 block">{user.title}</span>
                      </div>
                    </div>

                    <div className="text-left font-bold text-slate-300">
                      <span>{user.wins}</span>
                      <span className="text-[9px] text-slate-500 font-normal mr-0.5"> برد</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl">
            <h3 className="text-lg font-black text-white text-center">ویرایش پروفایل بازیکن</h3>
            
            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-bold">انتخاب آواتار ایموجی:</label>
              <div className="grid grid-cols-5 gap-2 max-h-[120px] overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { sound.playClick(); setEditAvatar(emoji); }}
                    className={`h-10 text-2xl flex items-center justify-center rounded-xl transition-all ${
                      editAvatar === emoji 
                        ? 'bg-indigo-600 border border-indigo-400 scale-105 shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-900 hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-bold">نام کاربری:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none transition-colors"
                placeholder="نام خود را وارد کنید"
                maxLength={15}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                ذخیره تغییرات
              </button>
              <button
                onClick={() => { sound.playClick(); setIsEditingProfile(false); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/50 transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Solo Practice AI Config Modal */}
      {showSoloModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-6 shadow-2xl">
            <h3 className="text-lg font-black text-white text-center">تنظیمات مبارزه با هوش مصنوعی</h3>
            
            {/* Bot Selection */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-bold">انتخاب حریف ربات:</label>
              <div className="space-y-2.5">
                {OPPONENTS.slice(0, 4).map((bot, idx) => {
                  let skillDesc = '';
                  if (bot.skill === 'predictive') skillDesc = 'نابغه پیش‌بینی (سخت‌ترین ربات، دست شما را حدس می‌زند)';
                  else if (bot.skill === 'rock_heavy') skillDesc = 'استاد سنگ (بیشتر سنگ می‌آورد)';
                  else if (bot.skill === 'aggressive') skillDesc = 'مدافع کاغذ (بیشتر کاغذ و تهاجمی بازی می‌کند)';
                  else skillDesc = 'حرکات کاملاً تصادفی و غیرقابل پیش‌بینی';

                  return (
                    <button
                      key={idx}
                      onClick={() => { sound.playClick(); setSelectedBotIndex(idx); }}
                      className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 text-right transition-all ${
                        selectedBotIndex === idx 
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750'
                      }`}
                    >
                      <span className="text-3xl bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">{bot.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{bot.name}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{bot.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">{skillDesc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rounds Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-bold">تعداد راندهای بازی:</label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => { sound.playClick(); setSoloRounds(r); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      soloRounds === r 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 1 ? 'تک راند' : `${r} راند`}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={startSoloMatch}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
              >
                <Play size={16} />
                شروع مسابقه
              </button>
              <button
                onClick={() => { sound.playClick(); setShowSoloModal(false); }}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl border border-slate-700/50 transition-all"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: P2P Matchmaking / WebRTC Connection Modal */}
      {showP2PModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            <h3 className="text-lg font-black text-white text-center">بازی آنلاین دو نفره واقعی (WebRTC)</h3>
            
            {/* Loading/Signaling State */}
            {peerLoading && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">در حال اتصال به سرور ابری سیگنالینگ...</p>
              </div>
            )}

            {/* Error State */}
            {!peerLoading && peerError && (
              <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertCircle size={20} />
                  <span className="font-bold text-sm">خطا در اتصال به سرور</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اتصال به شبکه آنلاین برقرار نشد. این مشکل معمولاً به دلیل فیلترینگ، بسته‌بودن پورت‌های WebRTC یا قطع اینترنت رخ می‌دهد.
                </p>
                <div className="p-2 bg-slate-950 rounded-lg text-[10px] text-slate-400 font-mono overflow-x-auto">
                  {peerError}
                </div>
                <button
                  onClick={() => { sound.playClick(); onInitPeer(); }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all"
                >
                  تلاش مجدد اتصال به شبکه
                </button>
              </div>
            )}

            {/* Peer Connected, show choices */}
            {!peerLoading && !peerError && peerId && (
              <div className="space-y-6">
                
                {/* Tabs to Create or Join */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => { sound.playClick(); setP2pMode('create'); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      p2pMode === 'create' || p2pMode === 'selection'
                        ? 'bg-purple-600 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ایجاد اتاق بازی
                  </button>
                  <button
                    onClick={() => { sound.playClick(); setP2pMode('join'); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      p2pMode === 'join' 
                        ? 'bg-purple-600 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ورود به اتاق دوست
                  </button>
                </div>

                {/* Create Room Mode */}
                {(p2pMode === 'create' || p2pMode === 'selection') && (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-slate-400">
                      اتاق شما با موفقیت در شبکه ساخته شد. برای شروع، لینک دعوت زیر را کپی کرده و برای دوست خود بفرستید:
                    </p>
                    
                    {/* Share Link Box */}
                    <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}${window.location.pathname}?room=${peerId}`}
                        className="flex-1 bg-transparent text-left font-mono text-[10px] text-indigo-300 outline-none overflow-hidden text-ellipsis whitespace-nowrap px-1"
                        dir="ltr"
                      />
                      <button
                        onClick={copyRoomLink}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors shrink-0"
                        title="کپی لینک"
                      >
                        <Copy size={14} />
                      </button>
                    </div>

                    {/* Waiting Indicator */}
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-500/20 rounded-2xl bg-purple-950/5 gap-3">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                      </div>
                      <p className="text-xs font-bold text-purple-300">در حال انتظار برای اتصال حریف...</p>
                      <p className="text-[10px] text-slate-500">وقتی دوستتان روی لینک کلیک کند، بازی به صورت خودکار آغاز خواهد شد.</p>
                    </div>
                  </div>
                )}

                {/* Join Room Mode */}
                {p2pMode === 'join' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      برای ورود به اتاق دوست خود، کد اتاق یا لینک کاملی که دریافت کرده‌اید را در فیلد زیر وارد کنید:
                    </p>
                    
                    {/* Input Room ID */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={targetRoomId}
                        onChange={(e) => {
                          // Extract ID if full URL is pasted
                          const val = e.target.value.trim();
                          if (val.includes('?room=')) {
                            const extracted = val.split('?room=')[1];
                            setTargetRoomId(extracted);
                          } else {
                            setTargetRoomId(val);
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-slate-100 outline-none transition-colors text-center font-mono placeholder:text-slate-700"
                        placeholder="کد اتاق (Room ID) یا لینک کامل"
                        dir="ltr"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!targetRoomId.trim()) {
                          alert('لطفاً کد اتاق را وارد کنید.');
                          return;
                        }
                        sound.playClick();
                        onConnectToPeer(targetRoomId.trim());
                      }}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check size={16} />
                      اتصال و ورود به بازی
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Bottom Note */}
            <div className="text-[10px] text-slate-500 text-center leading-relaxed pt-2 border-t border-slate-800/60 mt-4">
              نکته: برای تست راحت‌تر بازی دو نفره واقعی، می‌توانید این صفحه را در <strong className="text-slate-400">دو تب جداگانه مرورگر</strong> باز کرده و کد اتاق تولید شده در یک تب را در تب دیگر وارد کنید!
            </div>

            {/* Close Button */}
            <button
              onClick={() => { sound.playClick(); setShowP2PModal(false); }}
              className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Matchmaking Queue Screen Overlay */}
      {isMatching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="flex flex-col items-center text-center max-w-sm space-y-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
            {/* Matchmaking Radar Animation */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer Radar Rings */}
              <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border border-indigo-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-5 border-2 border-dashed border-indigo-500/50 rounded-full animate-spin [animation-duration:15s]"></div>
              
              {/* Inner Circle */}
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/40 border border-indigo-400">
                {profile.avatar}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">در حال جستجوی حریف آنلاین...</h3>
              <p className="text-xs text-indigo-400 font-semibold animate-pulse">شما در صف انتظار رقابت سریع هستید</p>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-4 pt-1">
                <span>زمان سپری شده: <strong className="text-white font-mono">{matchingTime} ثانیه</strong></span>
                <span>بازیکنان آنلاین: <strong className="text-white font-mono">۲,۴۸۰ نفر</strong></span>
              </div>
            </div>

            <div className="w-full p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
              سیستم در حال یافتن بازیکنی با سطح مهارتی و رتبه نزدیک به شماست... لطفا شکیبا باشید.
            </div>

            <button
              onClick={cancelQuickMatch}
              className="w-full py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all"
            >
              انصراف و خروج از صف
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};
