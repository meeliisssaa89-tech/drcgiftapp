import { Settings } from 'lucide-react';
import { CrystalIcon } from '@/components/CrystalIcon';
import { useGameStore } from '@/store/gameStore';
import { useTelegram } from '@/hooks/useTelegram';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type ProfileTab = 'gifts' | 'friends' | 'history';

export const ProfilePage = () => {
  const { user } = useTelegram();
  const { crystals, level, gifts, friends, history } = useGameStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('gifts');

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'gifts', label: 'Gifts' },
    { id: 'friends', label: 'Friends' },
    { id: 'history', label: 'History' },
  ];

  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;

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
        <button className="w-full btn-primary mt-4 text-base rounded-xl">
          Top Up
        </button>
      </div>

      {/* Invite Friends Card */}
      <div className="invite-gradient rounded-2xl p-5 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Invite friends</h3>
          <p className="text-white/80 text-sm">and earn 10% from their deposits</p>
        </div>
        <button className="btn-outline mt-4 w-full">
          Invite Friends
        </button>
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

        {activeTab === 'friends' && friends.length === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-muted-foreground text-sm">No friends invited yet</p>
          </div>
        )}

        {activeTab === 'history' && history.length === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-muted-foreground text-sm">No history yet</p>
          </div>
        )}

        {activeTab === 'history' && history.length > 0 && (
          <div className="w-full space-y-2">
            {history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-sm">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className={entry.type === 'loss' ? 'text-destructive' : 'text-primary'}>
                    {entry.type === 'loss' ? '-' : '+'}{entry.amount}
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
