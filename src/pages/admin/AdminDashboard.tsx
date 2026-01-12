import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminData } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminTabs, AdminTab } from './components/AdminTabs';
import { OverviewTab } from './components/OverviewTab';
import { UsersTab } from './components/UsersTab';
import { TasksTab } from './components/TasksTab';
import { PrizesTab } from './components/PrizesTab';
import { GiveawaysTab } from './components/GiveawaysTab';
import { SettingsTab } from './components/SettingsTab';
import { HistoryTab } from './components/HistoryTab';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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

  const {
    tasks,
    prizes,
    settings,
    giveaways,
    gameHistory,
    fetchAllData,
    createTask,
    updateTask,
    deleteTask,
    createPrize,
    updatePrize,
    deletePrize,
    updateSetting,
    createGiveaway,
    updateGiveaway,
    deleteGiveaway,
  } = useAdminData();

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

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, fetchAllData]);

  const handleRefresh = async () => {
    await Promise.all([fetchStats(), fetchUsers(), fetchAllData()]);
    toast.success('Data refreshed');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleUpdateLevel = async (userId: string, level: number, experience: number) => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.from('profiles').update({ level, experience }).eq('id', userId);
    if (error) {
      toast.error('Failed to update level');
      return false;
    }
    toast.success('Level updated');
    await fetchUsers();
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
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
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats} 
            tasksCount={tasks.filter(t => t.is_active).length}
            prizesCount={prizes.filter(p => p.is_active).length}
            giveawaysCount={giveaways.filter(g => g.is_active).length}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            onUpdateCrystals={updateUserCrystals}
            onUpdateLevel={handleUpdateLevel}
            onBanUser={banUser}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab 
            tasks={tasks}
            onCreate={createTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        )}

        {activeTab === 'prizes' && (
          <PrizesTab 
            prizes={prizes}
            onCreate={createPrize}
            onUpdate={updatePrize}
            onDelete={deletePrize}
          />
        )}

        {activeTab === 'giveaways' && (
          <GiveawaysTab 
            giveaways={giveaways}
            onCreate={createGiveaway}
            onUpdate={updateGiveaway}
            onDelete={deleteGiveaway}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            settings={settings}
            onUpdate={updateSetting}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab history={gameHistory} />
        )}
      </main>
    </div>
  );
};
