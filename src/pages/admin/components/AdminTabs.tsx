import { cn } from '@/lib/utils';
import { 
  Users, 
  Settings, 
  Gift, 
  ListTodo, 
  Trophy,
  History,
  BarChart3,
  Gamepad2
} from 'lucide-react';

export type AdminTab = 'overview' | 'users' | 'tasks' | 'prizes' | 'giveaways' | 'pvp-games' | 'settings' | 'history';

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
  { id: 'prizes', label: 'Prizes', icon: <Trophy className="w-4 h-4" /> },
  { id: 'giveaways', label: 'Giveaways', icon: <Gift className="w-4 h-4" /> },
  { id: 'pvp-games', label: 'PvP Games', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
];

export const AdminTabs = ({ activeTab, onTabChange }: AdminTabsProps) => {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-card rounded-xl p-1 border border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 text-sm",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
