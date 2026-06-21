export type Choice = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';

export type GameMode = 'solo' | 'local' | 'quick' | 'p2p' | null;

export type OpponentType = 'ai_classic' | 'ai_predictive' | 'ai_aggressive' | 'bot_quick' | 'local_player' | 'peer_player' | 'rock_heavy' | 'random' | 'scissors_heavy' | 'aggressive';

export type GameSkin = 'classic' | 'golden' | 'fire' | 'cyber' | 'hologram';

export interface PlayerProfile {
  username: string;
  avatar: string; // emoji or image
  coins: number;
  wins: number;
  losses: number;
  xp: number;
  unlockedSkins: GameSkin[];
  unlockedTitles: string[];
  activeSkin: GameSkin;
  activeTitle: string;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  xp: number;
  title: string;
  avatar: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  time: string;
  avatar: string;
  isSystem?: boolean;
  isSelf?: boolean;
}

export interface GameRound {
  playerChoice: Choice;
  opponentChoice: Choice;
  winner: 'player' | 'opponent' | 'draw';
  playerTitle: string;
  opponentTitle: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'skin' | 'title';
  value: string; // GameSkin name or title string
  previewColor: string; // tailwind classes
}
