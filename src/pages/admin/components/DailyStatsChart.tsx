import { useEffect } from 'react';
import { useDailyStats } from '@/hooks/useDailyStats';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, Gamepad2, Users, Gem } from 'lucide-react';

interface DailyStatsChartProps {
  onLoad?: () => void;
}

export const DailyStatsChart = ({ onLoad }: DailyStatsChartProps) => {
  const { dailyStats, isLoading, fetchDailyStats } = useDailyStats();

  useEffect(() => {
    fetchDailyStats(14);
  }, [fetchDailyStats]);

  useEffect(() => {
    if (!isLoading && dailyStats.length > 0 && onLoad) {
      onLoad();
    }
  }, [isLoading, dailyStats, onLoad]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate totals
  const totals = dailyStats.reduce(
    (acc, day) => ({
      games: acc.games + day.games,
      prizes: acc.prizes + day.prizes,
      bets: acc.bets + day.bets,
      newUsers: acc.newUsers + day.newUsers,
    }),
    { games: 0, prizes: 0, bets: 0, newUsers: 0 }
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Gamepad2 className="w-5 h-5" />}
          label="Total Games (14d)"
          value={totals.games}
          color="bg-green-500/10 text-green-500"
        />
        <SummaryCard
          icon={<Gem className="w-5 h-5" />}
          label="Prizes Given"
          value={totals.prizes}
          color="bg-purple-500/10 text-purple-500"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Bets"
          value={totals.bets}
          color="bg-blue-500/10 text-blue-500"
        />
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          label="New Users (14d)"
          value={totals.newUsers}
          color="bg-orange-500/10 text-orange-500"
        />
      </div>

      {/* Games Chart */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-green-500" />
          Daily Games Played
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={dailyStats}>
            <defs>
              <linearGradient id="gamesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={formatDate}
            />
            <Area
              type="monotone"
              dataKey="games"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gamesGradient)"
              name="Games"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Crystals Chart */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Gem className="w-5 h-5 text-purple-500" />
          Daily Crystals Flow
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={formatDate}
            />
            <Legend />
            <Bar dataKey="bets" fill="#3b82f6" name="Bets" radius={[4, 4, 0, 0]} />
            <Bar dataKey="prizes" fill="#a855f7" name="Prizes" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* New Users Chart */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          Daily New Users
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyStats}>
            <defs>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelFormatter={formatDate}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#usersGradient)"
              name="New Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const SummaryCard = ({ icon, label, value, color }: SummaryCardProps) => (
  <div className="bg-card rounded-xl p-4 border border-border">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);
