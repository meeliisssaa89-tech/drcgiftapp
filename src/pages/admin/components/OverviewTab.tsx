import { Users, Gem, Gamepad2, UserPlus, Share2, Gift, ListTodo, Trophy } from 'lucide-react';
import { DailyStatsChart } from './DailyStatsChart';

interface AdminStats {
  total_users: number | null;
  total_crystals: number | null;
  games_today: number | null;
  new_users_today: number | null;
  total_referrals: number | null;
}

interface OverviewTabProps {
  stats: AdminStats | null;
  tasksCount: number;
  prizesCount: number;
  giveawaysCount: number;
}

export const OverviewTab = ({ stats, tasksCount, prizesCount, giveawaysCount }: OverviewTabProps) => {
  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard 
          icon={<Gem className="w-5 h-5" />}
          label="Total Crystals"
          value={stats?.total_crystals ?? 0}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard 
          icon={<Gamepad2 className="w-5 h-5" />}
          label="Games Today"
          value={stats?.games_today ?? 0}
          color="bg-green-500/10 text-green-500"
        />
        <StatCard 
          icon={<UserPlus className="w-5 h-5" />}
          label="New Users Today"
          value={stats?.new_users_today ?? 0}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard 
          icon={<Share2 className="w-5 h-5" />}
          label="Total Referrals"
          value={stats?.total_referrals ?? 0}
          color="bg-pink-500/10 text-pink-500"
        />
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          icon={<ListTodo className="w-5 h-5" />}
          label="Active Tasks"
          value={tasksCount}
          color="bg-cyan-500/10 text-cyan-500"
        />
        <StatCard 
          icon={<Trophy className="w-5 h-5" />}
          label="Prizes"
          value={prizesCount}
          color="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard 
          icon={<Gift className="w-5 h-5" />}
          label="Giveaways"
          value={giveawaysCount}
          color="bg-red-500/10 text-red-500"
        />
      </div>

      {/* Daily Statistics Charts */}
      <div className="pt-4">
        <h2 className="text-xl font-bold mb-4">📊 Daily Statistics (Last 14 Days)</h2>
        <DailyStatsChart />
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className="bg-card rounded-xl p-4 border border-border">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);
