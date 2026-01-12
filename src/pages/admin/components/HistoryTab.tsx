import { GameHistory } from '@/hooks/useAdminData';

interface HistoryTabProps {
  history: GameHistory[];
}

export const HistoryTab = ({ history }: HistoryTabProps) => {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Game History (Last 100)</h2>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Time</th>
                <th className="text-left p-3 text-sm font-medium">Prize</th>
                <th className="text-left p-3 text-sm font-medium">Bet</th>
                <th className="text-left p-3 text-sm font-medium">Won</th>
                <th className="text-left p-3 text-sm font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span>{entry.prize_emoji}</span>
                      <span className="text-sm">{entry.prize_name}</span>
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {entry.bet_amount} 💎
                  </td>
                  <td className="p-3">
                    <span className={`text-sm font-medium ${entry.prize_amount > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {entry.prize_amount > 0 ? `+${entry.prize_amount}` : '0'} 💎
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.is_demo ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
                      {entry.is_demo ? 'Demo' : 'Real'}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No game history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
