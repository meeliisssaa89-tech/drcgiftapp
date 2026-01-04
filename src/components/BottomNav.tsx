import { Trophy, Gift, Dice5, Rocket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'leaders', label: 'Leaders', icon: Trophy },
  { id: 'giveaways', label: 'Giveaways', icon: Gift },
  { id: 'play', label: 'Play', icon: Dice5 },
  { id: 'tasks', label: 'Tasks', icon: Rocket, badge: true },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
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
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
