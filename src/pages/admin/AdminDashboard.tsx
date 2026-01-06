import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Gem, 
  Gamepad2, 
  UserPlus, 
  Share2, 
  LogOut,
  RefreshCw,
  Ban,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { 
    user, 
    isAdmin, 
    isLoading, 
    stats, 
    users, 
    signOut, 
    fetchStats, 
    fetchUsers,
    updateUserCrystals,
    banUser 
  } = useAdmin();

  const [editingUser, setEditingUser] = useState<{ id: string; crystals: number } | null>(null);
  const [newCrystals, setNewCrystals] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast.error('You do not have admin access');
      signOut();
      navigate('/admin/login');
    }
  }, [isLoading, user, isAdmin, signOut, navigate]);

  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchUsers()]);
    toast.success('Data refreshed');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleEditCrystals = (userId: string, currentCrystals: number) => {
    setEditingUser({ id: userId, crystals: currentCrystals });
    setNewCrystals(currentCrystals.toString());
  };

  const handleSaveCrystals = async () => {
    if (!editingUser) return;
    
    const crystals = parseInt(newCrystals);
    if (isNaN(crystals) || crystals < 0) {
      toast.error('Invalid crystal amount');
      return;
    }

    const success = await updateUserCrystals(editingUser.id, crystals);
    if (success) {
      toast.success('Crystals updated');
      setEditingUser(null);
    } else {
      toast.error('Failed to update crystals');
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to ban ${username || 'this user'}?`)) return;
    
    const success = await banUser(userId);
    if (success) {
      toast.success('User banned');
    } else {
      toast.error('Failed to ban user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl">🎰</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
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

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg">Users ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">User</th>
                  <th className="text-left p-3 text-sm font-medium">Telegram ID</th>
                  <th className="text-left p-3 text-sm font-medium">Level</th>
                  <th className="text-left p-3 text-sm font-medium">Crystals</th>
                  <th className="text-left p-3 text-sm font-medium">Joined</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                          {(u.first_name || u.username || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {u.first_name || u.username || 'Unknown'}
                          </p>
                          {u.username && (
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{u.telegram_id}</td>
                    <td className="p-3 text-sm">Lvl. {u.level}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        {u.crystals.toLocaleString()} 💎
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditCrystals(u.id, u.crystals)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleBanUser(u.id, u.first_name || u.username || '')}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Crystals Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Crystals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Crystals Amount</Label>
              <Input
                type="number"
                value={newCrystals}
                onChange={(e) => setNewCrystals(e.target.value)}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCrystals}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
