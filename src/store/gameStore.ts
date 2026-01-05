import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Prize {
  id: string;
  name: string;
  emoji: string;
  value: number;
  probability: number;
  type: 'crystals' | 'gift';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  emoji: string;
  reward: number;
  progress: number;
  maxProgress: number;
  type: 'daily' | 'weekly' | 'special' | 'all';
  timer?: number; // seconds remaining
  status: 'available' | 'in_progress' | 'claimable' | 'completed';
}

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  crystals: number;
  level: number;
  telegram_id: number;
}

export interface HistoryEntry {
  id: string;
  type: 'win' | 'loss' | 'deposit' | 'referral';
  amount: number;
  timestamp: number;
  description: string;
}

export interface LeaderEntry {
  id: string;
  name: string;
  avatar?: string;
  country: string;
  crystals: number;
  games: number;
  gifts: number;
  rank: number;
  telegram_id: number;
}

interface GameState {
  // Demo mode (local state only)
  isDemoMode: boolean;
  demoCrystals: number;
  
  // Local gifts collection (could be synced later)
  gifts: Prize[];
  
  // Actions
  setDemoMode: (isDemo: boolean) => void;
  addDemoCrystals: (amount: number) => void;
  deductDemoCrystals: (amount: number) => boolean;
  addGift: (gift: Prize) => void;
  resetDemoCrystals: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      isDemoMode: false,
      demoCrystals: 1000,
      gifts: [],

      setDemoMode: (isDemo) => set({ isDemoMode: isDemo }),
      
      addDemoCrystals: (amount) => {
        const { demoCrystals } = get();
        set({ demoCrystals: demoCrystals + amount });
      },
      
      deductDemoCrystals: (amount) => {
        const { demoCrystals } = get();
        if (demoCrystals >= amount) {
          set({ demoCrystals: demoCrystals - amount });
          return true;
        }
        return false;
      },
      
      addGift: (gift) => set((state) => ({ gifts: [...state.gifts, gift] })),
      
      resetDemoCrystals: () => set({ demoCrystals: 1000 }),
    }),
    {
      name: 'telegram-mini-app-storage',
    }
  )
);

// Prizes configuration
export const PRIZES: Prize[] = [
  { id: 'crystals_250', name: 'Crystals', emoji: '💎', value: 250, probability: 0.44, type: 'crystals' },
  { id: 'trophy', name: 'Trophy', emoji: '🏆', value: 100, probability: 1.33, type: 'gift' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', value: 100, probability: 1.33, type: 'gift' },
  { id: 'ring', name: 'Ring', emoji: '💍', value: 100, probability: 1.33, type: 'gift' },
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', value: 75, probability: 2.5, type: 'gift' },
  { id: 'champagne', name: 'Champagne', emoji: '🍾', value: 50, probability: 5, type: 'gift' },
  { id: 'flower', name: 'Flower', emoji: '🌹', value: 25, probability: 10, type: 'gift' },
  { id: 'star', name: 'Star', emoji: '⭐', value: 10, probability: 15, type: 'gift' },
  { id: 'nothing', name: 'Try Again', emoji: '💨', value: 0, probability: 63.07, type: 'crystals' },
];

// Tasks configuration
export const TASKS: Task[] = [
  {
    id: 'invite_5',
    title: 'Invite 5 friends',
    description: 'Invite 5 friends with minimum top-up of 10 crystals and get reward!',
    emoji: '👥',
    reward: 50,
    progress: 0,
    maxProgress: 5,
    type: 'all',
    status: 'in_progress',
  },
  {
    id: 'daily_reward',
    title: 'Daily reward',
    description: 'Claim your daily crystals',
    emoji: '🔑',
    reward: 1,
    progress: 1,
    maxProgress: 1,
    type: 'daily',
    status: 'claimable',
  },
  {
    id: 'play_5',
    title: 'Play 5 games',
    description: 'Play 5 spin games today',
    emoji: '🎲',
    reward: 5,
    progress: 0,
    maxProgress: 5,
    type: 'daily',
    timer: 20025, // 05:33:45
    status: 'in_progress',
  },
  {
    id: 'play_10',
    title: 'Play 10 games',
    description: 'Play 10 spin games today',
    emoji: '🎲',
    reward: 10,
    progress: 0,
    maxProgress: 10,
    type: 'daily',
    timer: 20025,
    status: 'in_progress',
  },
  {
    id: 'share_stories',
    title: 'Share to Stories',
    description: 'Share your wins to Telegram Stories',
    emoji: '📱',
    reward: 5,
    progress: 0,
    maxProgress: 1,
    type: 'daily',
    status: 'available',
  },
];

// Mock leaderboard data (for fallback when DB is empty)
export const LEADERBOARD: LeaderEntry[] = [
  { id: '1', name: 'Honeybee', avatar: '', country: '🇳🇬', crystals: 15050, games: 245, gifts: 32, rank: 1, telegram_id: 1 },
  { id: '2', name: 'Jey', avatar: '', country: '🇳🇬', crystals: 1006, games: 156, gifts: 18, rank: 2, telegram_id: 2 },
  { id: '3', name: 'Денис Пожарский', avatar: '', country: '🇦🇹', crystals: 600, games: 89, gifts: 12, rank: 3, telegram_id: 3 },
  { id: '4', name: 'MJ', avatar: '', country: '🇪🇬', crystals: 574, games: 67, gifts: 8, rank: 4, telegram_id: 4 },
  { id: '5', name: 'Андрей', avatar: '', country: '🇷🇺', crystals: 500, games: 54, gifts: 6, rank: 5, telegram_id: 5 },
  { id: '6', name: 'Гг', avatar: '', country: '🌍', crystals: 491, games: 45, gifts: 5, rank: 6, telegram_id: 6 },
];
