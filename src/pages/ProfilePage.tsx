import { Settings, Copy, Share2 } from 'lucide-react';
import { CrystalIcon } from '@/components/CrystalIcon';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { useGameStore } from '@/store/gameStore';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProfileTab = 'gifts' | 'friends' | 'history';

// Bot username - change this to your bot username
const BOT_USERNAME = 'YourBotUsername';

interface ProfilePageProps {
  onOpenDeposit?: () => void;
}

export const ProfilePage = ({ onOpenDeposit }: ProfilePageProps) => {
  const { user, openTelegramLink, hapticFeedback, isTelegram } = useTelegram();
  const { profile, gameHistory, referrals, isLoading } = useProfile();
  const { gifts } = useGameStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('gifts');

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'gifts', label: 'Gifts' },
    { id: 'friends', label: 'Friends' },
    { id: 'history', label: 'History' },
  ];

  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;
  const crystals = profile?.crystals ?? 0;
  const level = profile?.level ?? 1;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-24 animate-fade-in">
        <div className="card-telegram animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-[72px] h-[72px] rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-secondary rounded w-32" />
              <div className="h-8 bg-secondary rounded w-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* Profile Card */}
      <div className="card-telegram">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-[72px] h-[72px] rounded-full bg-secondary overflow-hidden avatar-ring">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground whitespace-nowrap">
              Lvl. {level}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold truncate">{displayName}</h2>
              {isPremium && <span>🌟</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-bold">{crystals}</span>
              <CrystalIcon size={24} />
            </div>
          </div>
          
          {/* Settings */}
          <button className="p-2.5 bg-secondary rounded-full flex-shrink-0">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Top Up Button */}
        <button 
          className="w-full btn-primary mt-4 text-base rounded-xl"
          onClick={() => {
            hapticFeedback('light');
            onOpenDeposit?.();
          }}
        >
          💎 Top Up
        </button>
      </div>

      {/* Invite Friends Card */}
      <div className="invite-gradient rounded-2xl p-5 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Invite friends</h3>
          <p className="text-white/80 text-sm">and earn 10% from their deposits</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => {
              const inviteLink = `https://t.me/${BOT_USERNAME}?startapp=${user?.id || ''}`;
              if (isTelegram) {
                openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Join Crystal Spin and win amazing prizes! 💎')}`);
              } else {
                navigator.clipboard.writeText(inviteLink);
                toast.success('Invite link copied!');
              }
              hapticFeedback('success');
            }}
            className="btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Invite Friends
          </button>
          <button 
            onClick={() => {
              const inviteLink = `https://t.me/${BOT_USERNAME}?startapp=${user?.id || ''}`;
              navigator.clipboard.writeText(inviteLink);
              toast.success('Link copied!');
              hapticFeedback('light');
            }}
            className="bg-white/20 text-white p-3 rounded-full"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-secondary rounded-xl p-1 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm",
              activeTab === tab.id ? "bg-card text-foreground" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card-telegram min-h-[180px] flex flex-col items-center justify-center">
        {activeTab === 'gifts' && gifts.length === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-muted-foreground text-sm">You don't have any gifts yet</p>
          </div>
        )}
        
        {activeTab === 'gifts' && gifts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full">
            {gifts.map((gift, index) => (
              <div key={index} className="card-elevated flex flex-col items-center p-3 rounded-xl">
                <span className="text-3xl">{gift.emoji}</span>
                <span className="text-xs mt-1 text-muted-foreground">{gift.name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'friends' && referrals.length === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-muted-foreground text-sm">No friends invited yet</p>
          </div>
        )}

        {activeTab === 'friends' && referrals.length > 0 && (
          <div className="w-full space-y-2">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-sm">Friend #{referral.referred_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary">
                  <span>+{referral.reward_earned}</span>
                  <CrystalIcon size={14} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && gameHistory.length === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-muted-foreground text-sm">No history yet</p>
          </div>
        )}

        {activeTab === 'history' && gameHistory.length > 0 && (
          <div className="w-full space-y-2">
            {gameHistory.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{entry.prize_emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{entry.prize_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Bet: {entry.bet_amount} • {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className={entry.prize_amount > 0 ? 'text-primary' : 'text-destructive'}>
                    {entry.prize_amount > 0 ? '+' : ''}{entry.prize_amount}
                  </span>
                  <CrystalIcon size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
