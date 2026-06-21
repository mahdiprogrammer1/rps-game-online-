import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Heart, Clock, Send, Smile, RotateCcw, 
  MessageSquare, Volume2, VolumeX 
} from 'lucide-react';
import { Choice, GameMode, OpponentType, PlayerProfile, GameSkin } from '../types/game';
import { CHAT_OPPONENT_RESPONSES } from '../utils/mockData';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GameArenaProps {
  mode: GameMode;
  opponentType: OpponentType;
  roundsToWin: number; // e.g. 2 wins for best of 3
  opponentInfo: { name: string; avatar: string; title: string; skill?: string; skin?: string };
  playerProfile: PlayerProfile;
  peerConnection: any; // PeerJS DataConnection if P2P
  onGameEnd: (result: 'win' | 'lose' | 'draw', earnedCoins: number, earnedXp: number) => void;
  onExit: () => void;
}

const CHOICE_EMOJIS: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
  lizard: '🦎',
  spock: '🖖'
};

const CHOICE_NAMES_FA: Record<Choice, string> = {
  rock: 'سنگ',
  paper: 'کاغذ',
  scissors: 'قیچی',
  lizard: 'مار',
  spock: 'اسپاک'
};

export const GameArena: React.FC<GameArenaProps> = ({
  mode,
  opponentType,
  roundsToWin,
  opponentInfo,
  playerProfile,
  peerConnection,
  onGameEnd,
  onExit
}) => {
  // Game Setup States
  const [isAdvanced, setIsAdvanced] = useState(false); // Toggle Classic vs Lizard-Spock
  
  // Game Play States
  const [round, setRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundHistory, setRoundHistory] = useState<('win' | 'lose' | 'draw')[]>([]);

  // Selection States
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [choicesLocked, setChoicesLocked] = useState(false);
  
  // Pass & Play (Local Multiplayer) turns
  const [localPlayer2Turn, setLocalPlayer2Turn] = useState(false);
  const [p1ChoiceHidden, setP1ChoiceHidden] = useState<Choice | null>(null);

  // Reveal States
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);
  const [showResultBanner, setShowResultBanner] = useState(false);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActive, setTimerActive] = useState(true);

  // Audio mute state
  const [muted, setMuted] = useState(sound.isMuted());

  // Chat & Floating Emojis States
  const [chatLog, setChatLog] = useState<{ sender: 'player' | 'opponent' | 'system'; text: string }[]>([]);
  const [presetChatOpen, setPresetChatOpen] = useState(false);
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; side: 'player' | 'opponent' }[]>([]);
  const [opponentBubble, setOpponentBubble] = useState<string | null>(null);
  
  // Match End States
  const [gameFinished, setGameFinished] = useState(false);
  const [gameWinner, setGameWinner] = useState<'player' | 'opponent' | 'draw' | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

  // History tracking for Predictive AI
  const [playerSelectionHistory, setPlayerSelectionHistory] = useState<Choice[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Skin styling classes
  const getSkinClasses = (skin: GameSkin) => {
    switch (skin) {
      case 'golden':
        return 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse';
      case 'fire':
        return 'bg-gradient-to-br from-orange-600 to-red-600 border-orange-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]';
      case 'cyber':
        return 'bg-gradient-to-br from-cyan-500 to-fuchsia-500 border-fuchsia-400 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]';
      case 'hologram':
        return 'bg-blue-950/40 backdrop-blur-sm border-2 border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] border-dashed';
      case 'classic':
      default:
        return 'bg-slate-800 border-slate-700 text-slate-100';
    }
  };

  // Determine skin for opponent
  const getOpponentSkin = (): GameSkin => {
    if (opponentInfo.skin) {
      return opponentInfo.skin as GameSkin;
    }
    if (opponentType === 'peer_player') {
      // In peer, could be anything, let's treat as classic unless synchronized. For simplicity:
      return 'classic';
    }
    // Bots can have cool thematic skins!
    if (opponentInfo.name.includes('استاد')) return 'golden';
    if (opponentInfo.name.includes('کوانتومی')) return 'hologram';
    if (opponentInfo.name.includes('سارا')) return 'cyber';
    if (opponentInfo.name.includes('الناز')) return 'fire';
    return 'classic';
  };

  // Sound toggle helper
  const toggleMute = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
    sound.playClick();
  };

  // Setup PeerJS event listeners for P2P mode
  useEffect(() => {
    if (mode === 'p2p' && peerConnection) {
      // Send initial hello
      peerConnection.send({
        type: 'init_game',
        username: playerProfile.username,
        avatar: playerProfile.avatar,
        title: playerProfile.activeTitle,
        skin: playerProfile.activeSkin
      });

      const handlePeerData = (data: any) => {
        if (data.type === 'choice') {
          setOpponentChoice(data.choice);
        } else if (data.type === 'chat') {
          addChatMessage('opponent', data.message);
          triggerOpponentBubble(data.message);
        } else if (data.type === 'emoji') {
          triggerEmoji(data.emoji, 'opponent');
        } else if (data.type === 'rematch_request') {
          setOpponentWantsRematch(true);
          addChatMessage('system', 'حریف درخواست بازی مجدد داده است.');
        } else if (data.type === 'rematch_accept') {
          resetForRematch();
        } else if (data.type === 'disconnect') {
          addChatMessage('system', 'حریف از اتاق خارج شد.');
          alert('ارتباط حریف قطع شد. بازگشت به لابی...');
          onExit();
        }
      };

      peerConnection.on('data', handlePeerData);

      // Add system message
      addChatMessage('system', 'اتصال برقرار شد! بازی آغاز شد.');

      return () => {
        peerConnection.off('data', handlePeerData);
      };
    }
  }, [mode, peerConnection]);

  // Quick Match Bot Chat Responses (Intro)
  useEffect(() => {
    if (mode === 'quick' || mode === 'solo') {
      const intros = CHAT_OPPONENT_RESPONSES.start;
      const randomIntro = intros[Math.floor(Math.random() * intros.length)];
      setTimeout(() => {
        addChatMessage('opponent', randomIntro);
        triggerOpponentBubble(randomIntro);
      }, 1000);
    }
  }, [mode]);

  // Scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Choice timer effect
  useEffect(() => {
    if (timerActive && !gameFinished && !localPlayer2Turn && !choicesLocked) {
      if (timeLeft === 0) {
        // Time ran out! Force a random selection
        const options: Choice[] = isAdvanced 
          ? ['rock', 'paper', 'scissors', 'lizard', 'spock'] 
          : ['rock', 'paper', 'scissors'];
        const randomChoice = options[Math.floor(Math.random() * options.length)];
        
        if (mode === 'local') {
          // In local, auto-select for whoever's turn it is
          handleChoiceSelection(randomChoice);
        } else {
          handleChoiceSelection(randomChoice);
        }
        return;
      }

      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
        sound.playTick();
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, timerActive, gameFinished, localPlayer2Turn, choicesLocked, isAdvanced, mode]);

  // Evaluate round when BOTH choices are locked/available
  useEffect(() => {
    if (playerChoice && opponentChoice && !choicesLocked) {
      setChoicesLocked(true);
      setTimerActive(false);
      
      // Start Countdown Reveal
      startCountdownReveal();
    }
  }, [playerChoice, opponentChoice, choicesLocked]);

  // Helper: Add chat message to log
  const addChatMessage = (sender: 'player' | 'opponent' | 'system', text: string) => {
    setChatLog(prev => [...prev, { sender, text }]);
  };

  // Helper: Trigger opponent dialogue speech bubble
  const triggerOpponentBubble = (text: string) => {
    setOpponentBubble(text);
    setTimeout(() => {
      setOpponentBubble(null);
    }, 4000);
  };

  // Helper: Trigger floating emojis
  const triggerEmoji = (emoji: string, side: 'player' | 'opponent') => {
    const id = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, { id, emoji, side }]);
    
    // Remove after animation finishes (2s)
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);

    // If P2P, send to peer
    if (side === 'player' && mode === 'p2p' && peerConnection) {
      peerConnection.send({ type: 'emoji', emoji });
    }
  };

  // Start the 3, 2, 1 reveal countdown
  const startCountdownReveal = () => {
    let count = 3;
    setCountdown(count);
    sound.playCountdown();

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        sound.playCountdown();
      } else {
        clearInterval(interval);
        setCountdown(null);
        revealRoundResults();
      }
    }, 800);
  };

  // Determine who beats who
  const evaluateWinner = (p: Choice, o: Choice): 'player' | 'opponent' | 'draw' => {
    if (p === o) return 'draw';

    if (p === 'scissors' && o === 'paper') return 'player';
    if (p === 'paper' && o === 'rock') return 'player';
    if (p === 'rock' && o === 'lizard') return 'player';
    if (p === 'lizard' && o === 'spock') return 'player';
    if (p === 'spock' && o === 'scissors') return 'player';
    if (p === 'scissors' && o === 'lizard') return 'player';
    if (p === 'lizard' && o === 'paper') return 'player';
    if (p === 'paper' && o === 'spock') return 'player';
    if (p === 'spock' && o === 'rock') return 'player';
    if (p === 'rock' && o === 'scissors') return 'player';

    // Otherwise opponent wins
    return 'opponent';
  };

  // Reveal results of the round
  const revealRoundResults = () => {
    if (!playerChoice || !opponentChoice) return;

    const result = evaluateWinner(playerChoice, opponentChoice);
    setRoundWinner(result);
    setIsRevealed(true);
    setShowResultBanner(true);

    // Track selection history for AI predictive modeling
    setPlayerSelectionHistory(prev => [...prev, playerChoice]);

    // Apply scores
    let nextPlayerScore = playerScore;
    let nextOpponentScore = opponentScore;

    if (result === 'player') {
      nextPlayerScore += 1;
      setPlayerScore(nextPlayerScore);
      setRoundHistory(prev => [...prev, 'win']);
      sound.playWin();
      
      // Bot comment
      if (mode === 'quick' || mode === 'solo') {
        const botResponses = CHAT_OPPONENT_RESPONSES.loseRound;
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        setTimeout(() => {
          addChatMessage('opponent', randomResp);
          triggerOpponentBubble(randomResp);
        }, 1200);
      }
    } else if (result === 'opponent') {
      nextOpponentScore += 1;
      setOpponentScore(nextOpponentScore);
      setRoundHistory(prev => [...prev, 'lose']);
      sound.playLose();

      // Bot comment
      if (mode === 'quick' || mode === 'solo') {
        const botResponses = CHAT_OPPONENT_RESPONSES.winRound;
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        setTimeout(() => {
          addChatMessage('opponent', randomResp);
          triggerOpponentBubble(randomResp);
        }, 1200);
      }
    } else {
      setRoundHistory(prev => [...prev, 'draw']);
      sound.playDraw();

      // Bot comment
      if (mode === 'quick' || mode === 'solo') {
        const botResponses = CHAT_OPPONENT_RESPONSES.draw;
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        setTimeout(() => {
          addChatMessage('opponent', randomResp);
          triggerOpponentBubble(randomResp);
        }, 1200);
      }
    }

    // Check if match is finished
    const isFinished = nextPlayerScore >= roundsToWin || nextOpponentScore >= roundsToWin;

    // Wait 4.5 seconds on reveal screen, then move to next round or finish
    setTimeout(() => {
      setShowResultBanner(false);
      
      if (isFinished) {
        finishMatch(nextPlayerScore, nextOpponentScore);
      } else {
        // Reset for next round
        setRound(r => r + 1);
        setPlayerChoice(null);
        setOpponentChoice(null);
        setChoicesLocked(false);
        setIsRevealed(false);
        setRoundWinner(null);
        setLocalPlayer2Turn(false);
        setP1ChoiceHidden(null);
        setTimeLeft(10);
        setTimerActive(true);
      }
    }, 4000);
  };

  // End the match and calculate awards
  const finishMatch = (finalPlayerScore: number, finalOpponentScore: number) => {
    setGameFinished(true);
    setTimerActive(false);

    let finalResult: 'win' | 'lose' | 'draw' = 'draw';
    let coins = 0;
    let xp = 0;

    if (finalPlayerScore > finalOpponentScore) {
      finalResult = 'win';
      setGameWinner('player');
      
      // Play epic win sound and confetti!
      sound.playWin();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Calculate coins & XP
      if (mode === 'quick') {
        coins = 50; // Quick match high reward
        xp = 200;
      } else if (mode === 'solo') {
        // More coins for predictive bot
        coins = opponentType === 'ai_predictive' ? 30 : 15;
        xp = opponentType === 'ai_predictive' ? 120 : 60;
      } else {
        // local or friend play
        coins = 10;
        xp = 40;
      }

      // Bot comment
      if (mode === 'quick' || mode === 'solo') {
        const botResponses = CHAT_OPPONENT_RESPONSES.loseMatch;
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        setTimeout(() => {
          addChatMessage('opponent', randomResp);
          triggerOpponentBubble(randomResp);
        }, 1000);
      }
    } else {
      finalResult = 'lose';
      setGameWinner('opponent');
      sound.playLose();

      // Participation rewards
      if (mode === 'quick') {
        coins = 10;
        xp = 50;
      } else if (mode === 'solo') {
        coins = 5;
        xp = 20;
      } else {
        coins = 5;
        xp = 10;
      }

      // Bot comment
      if (mode === 'quick' || mode === 'solo') {
        const botResponses = CHAT_OPPONENT_RESPONSES.winMatch;
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        setTimeout(() => {
          addChatMessage('opponent', randomResp);
          triggerOpponentBubble(randomResp);
        }, 1000);
      }
    }

    setCoinsEarned(coins);
    setXpEarned(xp);

    // Callback to update user profiles in parent
    onGameEnd(finalResult, coins, xp);
  };

  // Generate bot's choice using AI behaviors
  const generateBotChoice = (): Choice => {
    const choicesList: Choice[] = isAdvanced
      ? ['rock', 'paper', 'scissors', 'lizard', 'spock']
      : ['rock', 'paper', 'scissors'];

    if (opponentType === 'rock_heavy') {
      // Plays rock 70% of the time, else random
      return Math.random() < 0.7 ? 'rock' : choicesList[Math.floor(Math.random() * choicesList.length)];
    }

    if (opponentType === 'ai_aggressive' || opponentType === 'aggressive') {
      // Plays Paper 60%, Scissors 20%, Rock 20% (for classic)
      if (!isAdvanced) {
        const roll = Math.random();
        if (roll < 0.6) return 'paper';
        if (roll < 0.8) return 'scissors';
        return 'rock';
      }
      return 'paper';
    }

    if (opponentType === 'ai_predictive' || opponentType === 'bot_quick') {
      // The SMART Predictive bot! Checks player's history to counter it
      if (playerSelectionHistory.length < 2) {
        // default random for first two rounds
        return choicesList[Math.floor(Math.random() * choicesList.length)];
      }

      // Count what player played most
      const counts: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0, lizard: 0, spock: 0 };
      playerSelectionHistory.forEach(c => counts[c]++);

      let favoritePlayerChoice = playerSelectionHistory[0];
      let max = 0;
      (Object.keys(counts) as Choice[]).forEach(c => {
        if (counts[c] > max) {
          max = counts[c];
          favoritePlayerChoice = c;
        }
      });

      // Play the counter to player's favorite choice!
      if (!isAdvanced) {
        if (favoritePlayerChoice === 'rock') return 'paper';
        if (favoritePlayerChoice === 'paper') return 'scissors';
        return 'rock';
      } else {
        // In advanced, choose one of the two choices that beat it
        if (favoritePlayerChoice === 'rock') return Math.random() > 0.5 ? 'paper' : 'spock';
        if (favoritePlayerChoice === 'paper') return Math.random() > 0.5 ? 'scissors' : 'lizard';
        if (favoritePlayerChoice === 'scissors') return Math.random() > 0.5 ? 'rock' : 'spock';
        if (favoritePlayerChoice === 'lizard') return Math.random() > 0.5 ? 'rock' : 'scissors';
        return Math.random() > 0.5 ? 'paper' : 'lizard';
      }
    }

    // Default: completely random (ai_classic / random)
    return choicesList[Math.floor(Math.random() * choicesList.length)];
  };

  // Handle Player Choice Selection
  const handleChoiceSelection = (choice: Choice) => {
    if (choicesLocked || isRevealed) return;
    
    sound.playClick();

    if (mode === 'local') {
      // Local Hotseat (Pass & Play) logic
      if (!localPlayer2Turn) {
        // Player 1 selected, hide it, prompt Player 2
        setP1ChoiceHidden(choice);
        setLocalPlayer2Turn(true);
        setTimeLeft(10); // Reset timer for P2
      } else {
        // Player 2 selected. We have both!
        setPlayerChoice(p1ChoiceHidden);
        setOpponentChoice(choice);
      }
    } else {
      // Online P2P, Quick Match, or AI Bot
      setPlayerChoice(choice);

      // If playing AI/Bot, generate bot's choice with a slight delay
      if (mode === 'solo' || mode === 'quick') {
        const botChoice = generateBotChoice();
        // Simulate a small delay for "thinking" (400-800ms)
        setTimeout(() => {
          setOpponentChoice(botChoice);
        }, 400 + Math.random() * 400);
      }

      // If P2P, send choice to peer
      if (mode === 'p2p' && peerConnection) {
        peerConnection.send({ type: 'choice', choice });
      }
    }
  };

  // Send a custom chat message in-game
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const inputEl = e.currentTarget.querySelector('input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    sound.playChat();
    addChatMessage('player', text);
    inputEl.value = '';

    // If P2P, send to peer
    if (mode === 'p2p' && peerConnection) {
      peerConnection.send({ type: 'chat', message: text });
    }

    // If Quick/Solo, bot replies after 1.5s
    if (mode === 'quick' || mode === 'solo') {
      setTimeout(() => {
        const botReplies = [
          'تمرکزم روی بازیه! 😉',
          'خوبه، ولی حرکت بعدی رو چی می‌زنی؟ 🤔',
          'عالی! چت نکن بازی کن 😄👊',
          'جالب بود 👍',
          'عجب رقابتی!'
        ];
        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
        addChatMessage('opponent', randomReply);
        triggerOpponentBubble(randomReply);
        sound.playChat();
      }, 1500);
    }
  };

  // Send a preset quick chat message
  const sendPresetChat = (text: string) => {
    sound.playChat();
    addChatMessage('player', text);
    setPresetChatOpen(false);

    if (mode === 'p2p' && peerConnection) {
      peerConnection.send({ type: 'chat', message: text });
    }

    if (mode === 'quick' || mode === 'solo') {
      setTimeout(() => {
        const botReplies = [
          'منم موافقم! 😄',
          'کارت خوبه 👍',
          'آماده راند بعدی باش! 🔥',
          'عجب تفاهمی 🤝'
        ];
        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
        addChatMessage('opponent', randomReply);
        triggerOpponentBubble(randomReply);
        sound.playChat();
      }, 1200);
    }
  };

  // Rematch request handler
  const handleRequestRematch = () => {
    sound.playClick();
    setRematchRequested(true);

    if (mode === 'p2p' && peerConnection) {
      peerConnection.send({ type: 'rematch_request' });
      addChatMessage('system', 'درخواست بازی مجدد برای حریف ارسال شد.');
      
      // If opponent already wants rematch, start!
      if (opponentWantsRematch) {
        peerConnection.send({ type: 'rematch_accept' });
        resetForRematch();
      }
    } else {
      // Solo or Local: rematch instantly
      resetForRematch();
    }
  };

  const resetForRematch = () => {
    // Reset scores & states
    setRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundHistory([]);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setChoicesLocked(false);
    setIsRevealed(false);
    setRoundWinner(null);
    setLocalPlayer2Turn(false);
    setP1ChoiceHidden(null);
    setTimeLeft(10);
    setTimerActive(true);
    setGameFinished(false);
    setGameWinner(null);
    setRematchRequested(false);
    setOpponentWantsRematch(false);
    setPlayerSelectionHistory([]);

    addChatMessage('system', 'بازی مجدد آغاز شد! موفق باشید.');
  };

  const activeChoices: Choice[] = isAdvanced
    ? ['rock', 'paper', 'scissors', 'lizard', 'spock']
    : ['rock', 'paper', 'scissors'];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in relative min-h-[90vh] flex flex-col justify-between">
      
      {/* Dynamic inline stylesheet for floating emojis */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}</style>

      {/* Floating Emojis overlay */}
      {floatingEmojis.map(fe => (
        <div 
          key={fe.id}
          className={`absolute z-40 text-4xl animate-float-up pointer-events-none`}
          style={{
            top: '25%',
            left: fe.side === 'player' ? '25%' : '75%',
            transform: 'translateX(-50%)'
          }}
        >
          {fe.emoji}
        </div>
      ))}

      {/* Arena Top Header Panel (Scoreboard) */}
      <div className="bg-slate-900/60 p-4 md:p-6 rounded-3xl border border-slate-800/60 backdrop-blur-md">
        <div className="grid grid-cols-3 items-center gap-2">
          
          {/* Player Score Profile */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${getSkinClasses(playerProfile.activeSkin)}`}>
              {playerProfile.avatar}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs md:text-sm block truncate">{playerProfile.username}</span>
              <span className="text-[9px] text-indigo-400 block truncate">{playerProfile.activeTitle}</span>
              
              {/* Hearts representation of lives */}
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: roundsToWin }).map((_, i) => (
                  <Heart 
                    key={i} 
                    size={12} 
                    className={`transition-all duration-300 ${
                      i < playerScore 
                        ? 'text-rose-500 fill-rose-500 scale-110' 
                        : 'text-slate-700'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Central Timer & Info */}
          <div className="text-center space-y-1">
            <span className="px-3 py-1 bg-slate-950 border border-slate-850 text-slate-400 rounded-full text-[10px] font-bold">
              راند {round}
            </span>
            
            {/* Round History Dots */}
            {roundHistory.length > 0 && (
              <div className="flex items-center justify-center gap-1 pt-1">
                {roundHistory.map((res, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      res === 'win'
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                        : res === 'lose'
                        ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                        : 'bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Countdown / Timer Display */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {timerActive && !choicesLocked && !localPlayer2Turn ? (
                <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-2xl">
                  <Clock size={14} className="animate-pulse" />
                  <span className="font-mono text-sm font-black">{timeLeft}s</span>
                </div>
              ) : (
                <span className="text-slate-500 text-[11px] font-medium">انتخاب ثبت شد</span>
              )}
            </div>

            {/* Mode Tag */}
            <div className="text-[9px] text-slate-500 font-semibold pt-1">
              حالت: {isAdvanced ? 'پیشرفته (۵ نماد)' : 'کلاسیک (۳ نماد)'}
            </div>
          </div>

          {/* Opponent Score Profile */}
          <div className="flex items-center gap-3 justify-end text-left">
            <div className="min-w-0 text-right">
              <span className="font-bold text-white text-xs md:text-sm block truncate">{opponentInfo.name}</span>
              <span className="text-[9px] text-slate-400 block truncate">{opponentInfo.title}</span>
              
              {/* Hearts representation of lives */}
              <div className="flex gap-1 mt-1.5 justify-end">
                {Array.from({ length: roundsToWin }).map((_, i) => (
                  <Heart 
                    key={i} 
                    size={12} 
                    className={`transition-all duration-300 ${
                      i < opponentScore 
                        ? 'text-rose-500 fill-rose-500 scale-110' 
                        : 'text-slate-700'
                    }`} 
                  />
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${getSkinClasses(getOpponentSkin())}`}>
                {opponentInfo.avatar}
              </div>
              
              {/* Opponent Speech Bubble */}
              {opponentBubble && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900 text-slate-200 border border-slate-750 px-3 py-2 rounded-2xl rounded-bl-none text-[10px] w-36 shadow-xl leading-relaxed text-right z-30">
                  {opponentBubble}
                  <div className="absolute -bottom-2 right-4 w-3 h-3 bg-slate-900 border-r border-b border-slate-750 rotate-45"></div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Showdown / Reveal Arena Area */}
      <div className="flex-1 my-6 flex flex-col justify-center items-center relative min-h-[260px] bg-slate-950/20 border border-slate-900/40 rounded-3xl p-6">
        
        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-slate-950/80 rounded-3xl flex items-center justify-center z-20">
            <div className="text-center space-y-2">
              <div className="text-7xl font-black text-indigo-400 animate-bounce scale-150">
                {countdown}
              </div>
              <p className="text-sm text-slate-400 font-bold tracking-widest">نمایش دست‌ها...</p>
            </div>
          </div>
        )}

        {/* Local Play turn overlay (Pass & Play) */}
        {mode === 'local' && localPlayer2Turn && !isRevealed && (
          <div className="absolute inset-0 bg-slate-950/95 rounded-3xl flex flex-col items-center justify-center z-20 p-6 text-center space-y-4">
            <div className="text-5xl">📱</div>
            <h3 className="text-lg font-black text-white">نوبت بازیکن دوم ({opponentInfo.name})</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              بازیکن اول انتخاب خود را انجام داد. گوشی یا کیبورد را به بازیکن دوم بدهید تا انتخابش را ثبت کند.
            </p>
            <button
              onClick={() => {
                sound.playClick();
                setLocalPlayer2Turn(false);
              }}
              className="px-6 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95"
            >
              مشاهده صفحه و ثبت انتخاب بازیکن ۲
            </button>
          </div>
        )}

        {/* Classic / Advanced Toggle (Only allowed in lobby/before starting choice selection, or on round 1) */}
        {round === 1 && !playerChoice && (mode === 'solo' || mode === 'local') && (
          <div className="absolute top-4 bg-slate-900/60 p-1 rounded-xl border border-slate-800 flex text-[10px] font-bold">
            <button
              onClick={() => { sound.playClick(); setIsAdvanced(false); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${!isAdvanced ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              کلاسیک (۳ تایی)
            </button>
            <button
              onClick={() => { sound.playClick(); setIsAdvanced(true); }}
              className={`px-3 py-1.5 rounded-lg transition-all ${isAdvanced ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              پیشرفته (۵ تایی 🦎)
            </button>
          </div>
        )}

        {/* Arena Hands Showdown */}
        <div className="w-full grid grid-cols-2 gap-8 items-center justify-center max-w-lg">
          
          {/* Left: Player Hand */}
          <div className="flex flex-col items-center space-y-4">
            <span className="text-xs text-slate-500 font-bold">انتخاب شما</span>
            
            {isRevealed && playerChoice ? (
              <div className={`w-32 h-32 md:w-36 md:h-36 rounded-3xl border-2 flex items-center justify-center text-6xl md:text-7xl transition-all duration-500 scale-105 ${getSkinClasses(playerProfile.activeSkin)}`}>
                {CHOICE_EMOJIS[playerChoice]}
              </div>
            ) : playerChoice ? (
              // Locked selection placeholder
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-slate-900/80 border border-indigo-500/40 flex flex-col items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <span className="text-2xl animate-pulse">🔒</span>
                <span className="text-[10px] font-bold mt-2">دست شما قفل شد</span>
              </div>
            ) : (
              // Active choice wait placeholder
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-slate-950 border border-slate-900 flex items-center justify-center text-4xl text-slate-800 border-dashed animate-pulse">
                ❔
              </div>
            )}

            <span className="text-sm font-bold text-white">
              {isRevealed && playerChoice ? CHOICE_NAMES_FA[playerChoice] : '...'}
            </span>
          </div>

          {/* Right: Opponent Hand */}
          <div className="flex flex-col items-center space-y-4">
            <span className="text-xs text-slate-500 font-bold">انتخاب حریف</span>

            {isRevealed && opponentChoice ? (
              <div className={`w-32 h-32 md:w-36 md:h-36 rounded-3xl border-2 flex items-center justify-center text-6xl md:text-7xl transition-all duration-500 scale-105 ${getSkinClasses(getOpponentSkin())}`}>
                {CHOICE_EMOJIS[opponentChoice]}
              </div>
            ) : opponentChoice ? (
              // Locked selection placeholder
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-slate-900/80 border border-rose-500/40 flex flex-col items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <span className="text-2xl animate-pulse">🔒</span>
                <span className="text-[10px] font-bold mt-2">حریف انتخاب کرد</span>
              </div>
            ) : (
              // Active choice wait placeholder
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-slate-950 border border-slate-900 flex items-center justify-center text-4xl text-slate-800 border-dashed animate-pulse">
                ❔
              </div>
            )}

            <span className="text-sm font-bold text-white">
              {isRevealed && opponentChoice ? CHOICE_NAMES_FA[opponentChoice] : '...'}
            </span>
          </div>

        </div>

        {/* Round Result Banner */}
        {showResultBanner && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center z-20 px-4">
            <div className={`py-3 px-8 rounded-full font-black text-sm shadow-xl flex items-center gap-2 border animate-bounce ${
              roundWinner === 'player' 
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-600/20' 
                : roundWinner === 'opponent'
                ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/20'
                : 'bg-slate-800 text-slate-200 border-slate-750 shadow-slate-900/30'
            }`}>
              {roundWinner === 'player' && (
                <>
                  <span>🎉</span>
                  <span>راند را بردید!</span>
                </>
              )}
              {roundWinner === 'opponent' && (
                <>
                  <span>😢</span>
                  <span>راند را باختید!</span>
                </>
              )}
              {roundWinner === 'draw' && (
                <>
                  <span>🤝</span>
                  <span>راند مساوی شد!</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Choice Selection Panel */}
      {!choicesLocked && !isRevealed && !gameFinished && (
        <div className="space-y-4">
          <p className="text-center text-xs text-slate-400 font-medium">
            یکی از نمادهای زیر را برای ثبت انتخاب خود لمس کنید:
          </p>
          <div className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto">
            {activeChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceSelection(choice)}
                className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-indigo-500 hover:text-indigo-400 text-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{CHOICE_EMOJIS[choice]}</span>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-400">{CHOICE_NAMES_FA[choice]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Arena Bottom Controls (Chat, Emojis, Exit) */}
      {!gameFinished && (
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-t border-slate-900 pt-4 mt-2">
          
          {/* Reaction Buttons */}
          <div className="flex gap-2 relative">
            {/* Emojis Trigger */}
            <button
              onClick={() => { sound.playClick(); setEmojiPanelOpen(!emojiPanelOpen); setPresetChatOpen(false); }}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                emojiPanelOpen 
                  ? 'bg-amber-600 border-amber-500 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smile size={18} />
              واکنش‌ها
            </button>

            {/* Quick Chat Trigger */}
            <button
              onClick={() => { sound.playClick(); setPresetChatOpen(!presetChatOpen); setEmojiPanelOpen(false); }}
              className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                presetChatOpen 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={18} />
              پیام آماده
            </button>

            {/* Preset Emojis Floating Panel */}
            {emojiPanelOpen && (
              <div className="absolute bottom-14 right-0 bg-slate-900 border border-slate-800 p-2 rounded-2xl flex gap-2 shadow-2xl z-40 animate-fade-in">
                {['👍', '🔥', '😎', '🎉', '🤯', '😂', '😡'].map(em => (
                  <button
                    key={em}
                    onClick={() => {
                      sound.playClick();
                      triggerEmoji(em, 'player');
                      setEmojiPanelOpen(false);
                    }}
                    className="w-10 h-10 hover:bg-slate-800 text-2xl flex items-center justify-center rounded-xl transition-all active:scale-95"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Preset Chats Floating Panel */}
            {presetChatOpen && (
              <div className="absolute bottom-14 right-0 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl flex flex-col gap-1.5 shadow-2xl z-40 w-48 text-right animate-fade-in">
                {[
                  'سلام! موفق باشی 🤝',
                  'عجب بازی نفس‌گیری! 🤯',
                  'سنگ کاغذ قیچی بزن! ✊',
                  'خیلی قوی هستی! 👏',
                  'بازی بعدی رو می‌برم! 😎',
                  'شانسی زدی! 😂'
                ].map(text => (
                  <button
                    key={text}
                    onClick={() => sendPresetChat(text)}
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium text-right transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound, Help & Exit buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              title={muted ? 'روشن کردن صدا' : 'قطع صدا'}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => {
                if (confirm('آیا مطمئنی می‌خواهی از مسابقه خارج شوی؟ در این صورت بازنده اعلام خواهی شد!')) {
                  sound.playClick();
                  onExit();
                }
              }}
              className="px-4 py-2.5 bg-rose-900/20 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-900/30 hover:border-rose-900/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <X size={16} />
              تسلیم و خروج
            </button>
          </div>

        </div>
      )}

      {/* Game Chat Log (Desktop Drawer on Left) */}
      {!gameFinished && (
        <div className="hidden lg:flex flex-col bg-slate-900/30 border border-slate-900 rounded-2xl p-3 h-36 mt-4 text-xs">
          <div className="font-bold text-slate-500 mb-1 flex items-center gap-1">
            <MessageSquare size={12} />
            گزارش گفتگوهای مسابقه
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {chatLog.map((log, i) => (
              <div key={i} className="leading-relaxed">
                {log.sender === 'system' ? (
                  <span className="text-[10px] text-indigo-400 font-medium">📢 {log.text}</span>
                ) : (
                  <>
                    <strong className={log.sender === 'player' ? 'text-indigo-400' : 'text-slate-300'}>
                      {log.sender === 'player' ? 'شما: ' : `${opponentInfo.name}: `}
                    </strong>
                    <span className="text-slate-300">{log.text}</span>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-1.5 border-t border-slate-900 pt-2 mt-1">
            <input
              type="text"
              placeholder="ارسال پیام به حریف..."
              className="flex-1 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-[11px] text-slate-200 outline-none focus:border-indigo-600"
            />
            <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      {/* FINISHED OVERLAY SCREEN */}
      {gameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Background glowing particles or decorations */}
            <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[80px] opacity-30 ${
              gameWinner === 'player' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}></div>

            <div className="space-y-2 relative">
              <div className="text-5xl">
                {gameWinner === 'player' ? '🏆' : '😢'}
              </div>
              <h2 className="text-xl font-black text-white">
                {gameWinner === 'player' ? 'پیروزی در میدان نبرد!' : 'شکست در این مسابقه!'}
              </h2>
              <p className="text-xs text-slate-400">
                نتایج نهایی: <strong className="text-white">{playerScore}</strong> بر <strong className="text-white">{opponentScore}</strong> راند
              </p>
            </div>

            {/* Awards Panel */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850/80 space-y-3 relative">
              <h3 className="text-xs font-bold text-slate-500">جوایز کسب شده در این مسابقه:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">🪙 سکه طلا</span>
                  <span className="text-amber-400 font-black text-lg">+{coinsEarned}</span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">⚡ امتیاز تجربه (XP)</span>
                  <span className="text-indigo-400 font-black text-lg">+{xpEarned}</span>
                </div>
              </div>
            </div>

            {/* Rematch Status (for P2P multiplayer) */}
            {mode === 'p2p' && opponentWantsRematch && !rematchRequested && (
              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-xs text-purple-300 font-bold animate-pulse">
                حریف مایل به بازی مجدد است!
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 relative pt-2">
              <button
                onClick={handleRequestRematch}
                disabled={rematchRequested}
                className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-[0.98] ${
                  rematchRequested
                    ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                }`}
              >
                <RotateCcw size={16} />
                {rematchRequested ? 'منتظر تایید حریف...' : 'درخواست بازی مجدد'}
              </button>
              
              <button
                onClick={() => { sound.playClick(); onExit(); }}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/50 transition-all"
              >
                بازگشت به لابی اصلی
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
