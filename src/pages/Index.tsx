import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { ProfilePage } from '@/pages/ProfilePage';
import { PlayPage } from '@/pages/PlayPage';
import { TasksPage } from '@/pages/TasksPage';
import { LeadersPage } from '@/pages/LeadersPage';
import { GiveawaysPage } from '@/pages/GiveawaysPage';
import { useTelegram } from '@/hooks/useTelegram';
import { useProfile } from '@/hooks/useProfile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('play');
  const { isReady, isTelegram, startParam, hapticFeedback } = useTelegram();
  const { profile, processReferral } = useProfile();

  // Process referral from start parameter
  useEffect(() => {
    if (startParam && profile) {
      // startParam might be a referrer telegram ID
      const referrerId = parseInt(startParam, 10);
      if (!isNaN(referrerId) && referrerId !== profile.telegram_id) {
        processReferral(referrerId);
      }
    }
  }, [startParam, profile, processReferral]);

  // Handle tab change with haptic feedback
  const handleTabChange = (tab: string) => {
    hapticFeedback('selection');
    setActiveTab(tab);
  };

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
      {/* Dev mode indicator */}
      {!isTelegram && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black text-xs text-center py-1 z-50">
          🔧 Development Mode - Open in Telegram for full experience
        </div>
      )}
      
      <main className={`px-4 pt-4 pb-20 ${!isTelegram ? 'mt-6' : ''}`}>
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
