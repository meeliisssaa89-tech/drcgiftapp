import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, Play, ExternalLink, Share2, Users, Gift, CheckCircle } from 'lucide-react';
import { CrystalBadge } from '@/components/CrystalIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { useGameData, DbTask } from '@/hooks/useGameData';
import { useTaskProgress } from '@/hooks/useTaskProgress';
import { useHaptics } from '@/hooks/useHaptics';
import { useTelegram } from '@/hooks/useTelegram';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TaskTab = 'all' | 'daily' | 'weekly' | 'special';

const taskTabs: { id: TaskTab; label: string; emoji?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily', emoji: '📅' },
  { id: 'weekly', label: 'Weekly', emoji: '🗓️' },
  { id: 'special', label: 'Special', emoji: '⭐' },
];

const formatTimer = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get icon based on action type
const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'play_games':
      return <Play className="w-3.5 h-3.5" />;
    case 'invite':
      return <Users className="w-3.5 h-3.5" />;
    case 'share':
      return <Share2 className="w-3.5 h-3.5" />;
    case 'claim_daily':
      return <Gift className="w-3.5 h-3.5" />;
    case 'external_link':
      return <ExternalLink className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

// Get action button text
const getActionButtonText = (task: DbTask, status: string) => {
  if (status === 'claimable') return 'Claim';
  if (status === 'completed') return 'Done';
  
  switch (task.action_type) {
    case 'play_games':
      return 'Play';
    case 'invite':
      return 'Invite';
    case 'share':
      return 'Share';
    case 'claim_daily':
      return status === 'available' ? 'Claim' : 'Wait';
    case 'external_link':
      return 'Open';
    default:
      return 'Start';
  }
};

export const TasksPage = () => {
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const { tasks: dbTasks, isLoading: tasksLoading } = useGameData();
  const { getTaskProgress, startTask, claimReward, updateProgress, isLoading: progressLoading } = useTaskProgress();
  const { buttonPress, selectionChange, success, error, celebrate } = useHaptics();
  const { openTelegramLink, openLink, isTelegram } = useTelegram();
  const { profile } = useProfile();

  // Timer state for countdown
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [dailyClaimTimers, setDailyClaimTimers] = useState<Record<string, number>>({});

  // Initialize timers
  useEffect(() => {
    const initialTimers: Record<string, number> = {};
    const dailyTimers: Record<string, number> = {};
    
    dbTasks.forEach((task) => {
      const progress = getTaskProgress(task.id);
      
      if (task.timer_hours && task.action_type !== 'claim_daily') {
        if (!progress?.completed) {
          initialTimers[task.id] = task.timer_hours * 3600;
        }
      }
      
      // For daily claim tasks, calculate time until next claim
      if (task.action_type === 'claim_daily' && progress?.claimed) {
        const lastClaim = progress.completed_at ? new Date(progress.completed_at) : null;
        if (lastClaim && task.timer_hours) {
          const nextClaimTime = new Date(lastClaim.getTime() + task.timer_hours * 3600 * 1000);
          const now = new Date();
          const remainingMs = nextClaimTime.getTime() - now.getTime();
          if (remainingMs > 0) {
            dailyTimers[task.id] = Math.floor(remainingMs / 1000);
          }
        }
      }
    });
    
    setTimers(initialTimers);
    setDailyClaimTimers(dailyTimers);
  }, [dbTasks, getTaskProgress]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) updated[key] -= 1;
        });
        return updated;
      });
      
      setDailyClaimTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) {
            updated[key] -= 1;
          } else {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getFilteredTasks = () => {
    if (activeTab === 'all') return dbTasks;
    return dbTasks.filter((task) => task.type === activeTab);
  };

  const filteredTasks = getFilteredTasks();

  const getTaskStatus = (task: DbTask): 'available' | 'in_progress' | 'claimable' | 'completed' | 'waiting' => {
    const progress = getTaskProgress(task.id);
    
    // Check if daily task is on cooldown
    if (task.action_type === 'claim_daily' && dailyClaimTimers[task.id]) {
      return 'waiting';
    }
    
    if (!progress) return 'available';
    if (progress.claimed) return 'completed';
    if (progress.completed) return 'claimable';
    if (progress.progress > 0) return 'in_progress';
    return 'available';
  };

  // Handle task action based on type
  const handleTaskAction = useCallback(async (task: DbTask) => {
    const status = getTaskStatus(task);
    buttonPress();

    // Handle claim action
    if (status === 'claimable') {
      celebrate();
      await claimReward(task.id, task.reward);
      return;
    }

    // Handle waiting state
    if (status === 'waiting') {
      error();
      toast.info('Please wait for the timer to finish');
      return;
    }

    // Handle different action types
    switch (task.action_type) {
      case 'play_games':
        // Navigate to play tab - handled by parent
        toast.info('Go to Play tab to complete this task!');
        break;

      case 'invite':
        // Open invite flow
        if (profile) {
          const inviteUrl = `https://t.me/YOUR_BOT?start=${profile.telegram_id}`;
          if (isTelegram) {
            openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Join me and get bonus crystals! 💎')}`);
          } else {
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Invite link copied!');
          }
        }
        break;

      case 'share':
        // Share to stories
        toast.info('Share feature coming soon!');
        break;

      case 'claim_daily':
        // Claim daily reward
        success();
        await updateProgress(task.id, 1, task.max_progress);
        await claimReward(task.id, task.reward);
        toast.success(`+${task.reward} crystals claimed!`);
        break;

      case 'external_link':
        // Open external link
        if (task.action_url) {
          if (isTelegram) {
            openLink(task.action_url);
          } else {
            window.open(task.action_url, '_blank');
          }
          // Mark as started
          await startTask(task.id);
        }
        break;

      default:
        // Manual task - just start tracking
        await startTask(task.id);
        break;
    }
  }, [buttonPress, celebrate, claimReward, error, success, profile, isTelegram, openTelegramLink, openLink, updateProgress, startTask, getTaskStatus]);

  const handleTabChange = (tab: TaskTab) => {
    selectionChange();
    setActiveTab(tab);
  };

  const isLoading = tasksLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {taskTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 text-sm active:scale-95",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const progress = getTaskProgress(task.id);
          const status = getTaskStatus(task);
          const currentProgress = progress?.progress || 0;
          const timer = timers[task.id];
          const dailyTimer = dailyClaimTimers[task.id];

          return (
            <div 
              key={task.id} 
              className={cn(
                "card-telegram transition-all duration-200",
                status === 'claimable' && "ring-2 ring-primary/50 bg-primary/5",
                status === 'completed' && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                    status === 'completed' ? 'bg-green-500/20' : 'bg-secondary'
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      task.emoji
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex-shrink-0">
                  {status === 'waiting' && dailyTimer ? (
                    <div className="flex items-center gap-1 text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimer(dailyTimer)}</span>
                    </div>
                  ) : status === 'completed' ? (
                    <span className="text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl font-medium">
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTaskAction(task)}
                      className={cn(
                        "px-4 py-1.5 rounded-xl font-medium text-sm flex items-center gap-1.5 transition-all duration-200 active:scale-95",
                        status === 'claimable' 
                          ? "bg-green-500 text-white animate-pulse" 
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {getActionIcon(task.action_type)}
                      <span>{getActionButtonText(task, status)}</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress and Reward */}
              <div className="flex items-center justify-between mt-3 gap-3">
                <CrystalBadge amount={task.reward} size="sm" />
                
                <div className="flex-1 flex items-center gap-2">
                  <ProgressBar 
                    progress={currentProgress} 
                    max={task.max_progress} 
                    showLabel={false}
                    className="flex-1" 
                  />
                  <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                    {currentProgress}/{task.max_progress}
                  </span>
                </div>

                {/* Timer for non-daily tasks */}
                {timer !== undefined && timer > 0 && status === 'in_progress' && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimer(timer)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="card-telegram min-h-[180px] flex flex-col items-center justify-center">
          <span className="text-5xl mb-3">📋</span>
          <p className="text-muted-foreground text-sm">No tasks available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Check back later!</p>
        </div>
      )}
    </div>
  );
};
