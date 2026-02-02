import { Trophy, Gamepad2, Dice5, Rocket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasNewTasks?: boolean;
}

const navItems = [
  { id: 'leaders', label: 'Leaders', icon: Trophy },
  { id: 'pvp', label: 'PvP Games', icon: Gamepad2 },
  { id: 'play', label: 'Play', icon: Dice5 },
  { id: 'tasks', label: 'Tasks', icon: Rocket, hasBadge: true },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav = ({ activeTab, onTabChange, hasNewTasks = true }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div 
        className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl"
        style={{ 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
        }}
      >
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
                  isActive ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {item.hasBadge && hasNewTasks && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-badge" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
