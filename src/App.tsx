import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { GameArena } from './components/GameArena';
import { Shop } from './components/Shop';
import { RulesModal } from './components/RulesModal';
import { PlayerProfile, GameMode, OpponentType } from './types/game';
import { sound } from './utils/audio';
import Peer from 'peerjs';

const DEFAULT_PROFILE: PlayerProfile = {
  username: 'بازیکن_' + Math.floor(1000 + Math.random() * 9000),
  avatar: '🥷',
  coins: 100,
  wins: 0,
  losses: 0,
  xp: 0,
  unlockedSkins: ['classic'],
  unlockedTitles: ['نوآموز سنگ'],
  activeSkin: 'classic',
  activeTitle: 'نوآموز سنگ'
};

export default function App() {
  // Navigation View
  const [view, setView] = useState<'lobby' | 'arena' | 'shop'>('lobby');
  
  // Rules Modal State
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Player Profile State (Persisted in LocalStorage)
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rps_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return DEFAULT_PROFILE;
        }
      }
    }
    return DEFAULT_PROFILE;
  });

  // Save profile on changes
  useEffect(() => {
    localStorage.setItem('rps_profile', JSON.stringify(profile));
  }, [profile]);

  // PeerJS signaling states
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [peerLoading, setPeerLoading] = useState<boolean>(false);
  const [peerError, setPeerError] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<any>(null);
  
  // Active Room ID from URL parameters (?room=XYZ)
  const [activeRoomIdFromUrl, setActiveRoomIdFromUrl] = useState<string | null>(null);

  // Active Game States (passed to Arena)
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [opponentType, setOpponentType] = useState<OpponentType>('ai_classic');
  const [roundsToWin, setRoundsToWin] = useState<number>(2); // Default best of 3 (first to 2)
  const [opponentInfo, setOpponentInfo] = useState<{ name: string; avatar: string; title: string; skill?: string; skin?: string } | null>(null);

  // Detect invite link in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setActiveRoomIdFromUrl(room);
        
        // Clean the URL so refreshing doesn't force re-join
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Initialize PeerJS for P2P multiplayer
  const handleInitPeer = () => {
    if (peer) return;
    setPeerLoading(true);
    setPeerError(null);

    try {
      // Initialize PeerJS with public cloud signaling server
      const newPeer = new Peer();

      newPeer.on('open', (id) => {
        setPeerId(id);
        setPeerLoading(false);
      });

      // Host listener: when someone connects to our room
      newPeer.on('connection', (conn) => {
        setPeerConnection(conn);
        setupConnectionListeners(conn);
      });

      newPeer.on('error', (err) => {
        console.error('PeerJS error:', err);
        setPeerError(getPeerErrorMessage(err.type || err.message));
        setPeerLoading(false);
      });

      setPeer(newPeer);
    } catch (e: any) {
      setPeerError(e.message || String(e));
      setPeerLoading(false);
    }
  };

  // Connect to friend's Peer ID (Guest joining Host)
  const handleConnectToPeer = (targetId: string) => {
    if (!peer) return;
    setPeerLoading(true);
    setPeerError(null);

    try {
      const conn = peer.connect(targetId);
      setPeerConnection(conn);
      setupConnectionListeners(conn);
    } catch (e: any) {
      setPeerError(e.message || String(e));
      setPeerLoading(false);
    }
  };

  // Helper: Friendly error messages for network issues
  const getPeerErrorMessage = (errType: string): string => {
    switch (errType) {
      case 'network':
        return 'خطای شبکه: اتصال به سرور قطع شد. احتمالاً به دلیل فیلترینگ یا قطعی اینترنت است.';
      case 'peer-unavailable':
        return 'اتاق یافت نشد! مطمئن شوید کد اتاق را درست وارد کرده‌اید یا اتاق میزبان بسته نشده است.';
      case 'browser-incompatible':
        return 'مرورگر شما از پروتکل بازی آنلاین (WebRTC) پشتیبانی نمی‌کند. لطفاً آن را آپدیت کنید.';
      case 'webrtc':
        return 'خطای پروتکل WebRTC: پورت‌های ارتباطی توسط فایروال یا اینترنت شما مسدود شده‌اند.';
      default:
        return `اتصال برقرار نشد (کد خطا: ${errType})`;
    }
  };

  // Setup connection event handlers
  const setupConnectionListeners = (conn: any) => {
    conn.on('open', () => {
      setPeerLoading(false);
      
      // Handshake: Send our profile info immediately
      conn.send({
        type: 'init_game',
        username: profile.username,
        avatar: profile.avatar,
        title: profile.activeTitle,
        skin: profile.activeSkin
      });
    });

    conn.on('data', (data: any) => {
      if (data.type === 'init_game') {
        // We received the opponent's profile! Handshake complete.
        setOpponentInfo({
          name: data.username,
          avatar: data.avatar,
          title: data.title,
          skin: data.skin
        });

        // Switch both players to the arena
        setGameMode('p2p');
        setOpponentType('peer_player');
        setRoundsToWin(2); // Best of 3 (first to 2 wins)
        setView('arena');
      }
    });

    conn.on('close', () => {
      setPeerConnection(null);
      setOpponentInfo(null);
    });

    conn.on('error', (err: any) => {
      console.error('Connection error:', err);
      setPeerError('خطا در برقراری ارتباط پایدار با حریف.');
      setPeerLoading(false);
    });
  };

  // Disconnect/cleanup P2P session
  const handleCloseConnection = () => {
    if (peerConnection) {
      try {
        peerConnection.send({ type: 'disconnect' });
        peerConnection.close();
      } catch (e) {}
      setPeerConnection(null);
    }
    setOpponentInfo(null);
  };

  // Trigger game start (Quick match, solo practice, local same-screen)
  const handleStartGame = (
    mode: GameMode, 
    oppType: OpponentType, 
    rounds: number, 
    oppInfo?: { name: string; avatar: string; title: string; skill?: string }
  ) => {
    setGameMode(mode);
    setOpponentType(oppType);
    
    // Set target round wins (e.g. 2 wins for best of 3, 3 wins for best of 5, etc.)
    if (rounds === 1) setRoundsToWin(1);
    else if (rounds === 3) setRoundsToWin(2);
    else if (rounds === 5) setRoundsToWin(3);
    else setRoundsToWin(5); // 10 rounds means first to 5 wins

    if (oppInfo) {
      setOpponentInfo(oppInfo);
    } else {
      setOpponentInfo({
        name: 'حریف',
        avatar: '🥷',
        title: 'رقیب سرسخت'
      });
    }

    setView('arena');
  };

  // Update profile from components (buying skins, titles, updating name, etc.)
  const handleUpdateProfile = (updated: Partial<PlayerProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updated
    }));
  };

  // Handle Game Over: Award coins and XP
  const handleGameEnd = (result: 'win' | 'lose' | 'draw', earnedCoins: number, earnedXp: number) => {
    setProfile(prev => {
      const nextWins = result === 'win' ? prev.wins + 1 : prev.wins;
      const nextLosses = result === 'lose' ? prev.losses + 1 : prev.losses;
      const nextXp = prev.xp + earnedXp;
      const nextCoins = prev.coins + earnedCoins;

      return {
        ...prev,
        wins: nextWins,
        losses: nextLosses,
        xp: nextXp,
        coins: nextCoins
      };
    });
  };

  // Clean up P2P and return to Lobby
  const handleExitToLobby = () => {
    handleCloseConnection();
    setView('lobby');
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 py-6 px-4 md:px-8">
      {/* Dynamic View Renderer */}
      {view === 'lobby' && (
        <Lobby
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onStartGame={handleStartGame}
          onOpenShop={() => setView('shop')}
          onOpenRules={() => setIsRulesOpen(true)}
          activeRoomIdFromUrl={activeRoomIdFromUrl}
          peerObject={peer}
          peerId={peerId}
          peerLoading={peerLoading}
          peerError={peerError}
          onInitPeer={handleInitPeer}
          onConnectToPeer={handleConnectToPeer}
        />
      )}

      {view === 'arena' && opponentInfo && (
        <GameArena
          mode={gameMode}
          opponentType={opponentType}
          roundsToWin={roundsToWin}
          opponentInfo={opponentInfo}
          playerProfile={profile}
          peerConnection={peerConnection}
          onGameEnd={handleGameEnd}
          onExit={handleExitToLobby}
        />
      )}

      {view === 'shop' && (
        <Shop
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBack={() => setView('lobby')}
        />
      )}

      {/* Shared Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => {
          sound.playClick();
          setIsRulesOpen(false);
        }}
      />
    </div>
  );
}
