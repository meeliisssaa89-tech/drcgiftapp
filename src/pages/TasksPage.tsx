import { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { CrystalBadge } from '@/components/CrystalIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { useGameData } from '@/hooks/useGameData';
import { useTaskProgress } from '@/hooks/useTaskProgress';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

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

export const TasksPage = () => {
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const { tasks: dbTasks, isLoading: tasksLoading } = useGameData();
  const { getTaskProgress, startTask, claimReward, isLoading: progressLoading } = useTaskProgress();
  const { hapticFeedback } = useTelegram();

  // Timer state for countdown
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Initialize timers from task timer_hours
  useEffect(() => {
    const initialTimers: Record<string, number> = {};
    dbTasks.forEach((task) => {
      if (task.timer_hours) {
        const progress = getTaskProgress(task.id);
        if (!progress?.completed) {
          // Calculate remaining time
          initialTimers[task.id] = task.timer_hours * 3600;
        }
      }
    });
    setTimers(initialTimers);
  }, [dbTasks, getTaskProgress]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) {
            updated[key] -= 1;
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

  const getTaskStatus = (taskId: string, maxProgress: number) => {
    const progress = getTaskProgress(taskId);
    if (!progress) return 'available';
    if (progress.claimed) return 'completed';
    if (progress.completed) return 'claimable';
    if (progress.progress > 0) return 'in_progress';
    return 'available';
  };

  const handleClaimTask = async (taskId: string, reward: number) => {
    hapticFeedback('success');
    await claimReward(taskId, reward);
  };

  const handleStartTask = async (taskId: string) => {
    hapticFeedback('light');
    await startTask(taskId);
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
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 text-sm",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
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
          const status = getTaskStatus(task.id, task.max_progress);
          const currentProgress = progress?.progress || 0;
          const timer = timers[task.id];

          return (
            <div key={task.id} className="card-telegram">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{task.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{task.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  </div>
                </div>
                
                {status === 'claimable' && (
                  <button
                    onClick={() => handleClaimTask(task.id, task.reward)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-medium text-sm flex-shrink-0"
                  >
                    Claim
                  </button>
                )}
                
                {status === 'available' && (
                  <button
                    onClick={() => handleStartTask(task.id)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-medium text-sm flex-shrink-0"
                  >
                    Start
                  </button>
                )}
                
                {status === 'completed' && (
                  <span className="text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl">
                    ✓ Done
                  </span>
                )}
                
                {timer !== undefined && timer > 0 && status === 'in_progress' && (
                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl text-xs flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(timer)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <CrystalBadge amount={task.reward} size="sm" />
                <ProgressBar 
                  progress={currentProgress} 
                  max={task.max_progress} 
                  showLabel={status !== 'claimable' && status !== 'completed'}
                  className="flex-1 ml-4" 
                />
                {status === 'claimable' && (
                  <span className="text-xs text-muted-foreground ml-2">100%</span>
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
        </div>
      )}
    </div>
  );
};
