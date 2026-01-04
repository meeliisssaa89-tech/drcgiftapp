import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { ProfilePage } from '@/pages/ProfilePage';
import { PlayPage } from '@/pages/PlayPage';
import { TasksPage } from '@/pages/TasksPage';
import { LeadersPage } from '@/pages/LeadersPage';
import { GiveawaysPage } from '@/pages/GiveawaysPage';
import { useTelegram } from '@/hooks/useTelegram';

const Index = () => {
  const [activeTab, setActiveTab] = useState('play');
  const { isReady } = useTelegram();

  // Show loading state while Telegram SDK initializes
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'leaders':
        return <LeadersPage />;
      case 'giveaways':
        return <GiveawaysPage />;
      case 'play':
        return <PlayPage />;
      case 'tasks':
        return <TasksPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <PlayPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pt-4 pb-20">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
