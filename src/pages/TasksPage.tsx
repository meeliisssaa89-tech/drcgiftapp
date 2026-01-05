import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { CrystalBadge } from '@/components/CrystalIcon';
import { ProgressBar } from '@/components/ProgressBar';
import { TASKS, Task } from '@/store/gameStore';
import { useProfile } from '@/hooks/useProfile';
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
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const { addCrystals } = useProfile();
  const { hapticFeedback } = useTelegram();

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) =>
          task.timer && task.timer > 0
            ? { ...task, timer: task.timer - 1 }
            : task
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredTasks = () => {
    if (activeTab === 'all') return tasks;
    return tasks.filter((task) => task.type === activeTab);
  };

  const filteredTasks = getFilteredTasks();

  const handleClaimTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status === 'claimable') {
      hapticFeedback('success');
      await addCrystals(task.reward);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'completed' } : t
        )
      );
    }
  };

  const handleStartTask = (taskId: string) => {
    hapticFeedback('light');
  };

  const dailyTasks = tasks.filter((task) => task.type === 'daily');

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

      {/* Special Invite Task Card */}
      {(activeTab === 'all' || activeTab === 'special') && (
        <div className="card-telegram">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">👥</span>
              <h3 className="font-semibold text-sm">Invite 5 friends</h3>
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-medium text-sm flex-shrink-0">
              Invite
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Invite 5 friends with minimum top-up of 10 crystals and get reward!
          </p>
          <div className="flex items-center justify-between mt-3">
            <CrystalBadge amount={50} size="sm" />
            <ProgressBar progress={0} max={5} className="flex-1 ml-4" />
          </div>
        </div>
      )}

      {/* Daily Tasks Section */}
      {(activeTab === 'all' || activeTab === 'daily') && dailyTasks.length > 0 && (
        <div className="space-y-3">
          {activeTab === 'all' && (
            <h2 className="text-base font-bold">Daily Tasks</h2>
          )}
          
          {dailyTasks.map((task) => (
            <div key={task.id} className="card-telegram">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{task.emoji}</span>
                  <h3 className="font-semibold text-sm">{task.title}</h3>
                </div>
                
                {task.status === 'claimable' && (
                  <button
                    onClick={() => handleClaimTask(task.id)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-medium text-sm flex-shrink-0"
                  >
                    Claim
                  </button>
                )}
                
                {task.status === 'available' && (
                  <button
                    onClick={() => handleStartTask(task.id)}
                    className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-medium text-sm flex-shrink-0"
                  >
                    Start
                  </button>
                )}
                
                {task.timer && task.status === 'in_progress' && (
                  <div className="flex items-center gap-1 text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl text-xs flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTimer(task.timer)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <CrystalBadge amount={task.reward} size="sm" />
                <ProgressBar 
                  progress={task.progress} 
                  max={task.maxProgress} 
                  showLabel={task.status !== 'claimable'}
                  className="flex-1 ml-4" 
                />
                {task.status === 'claimable' && (
                  <span className="text-xs text-muted-foreground ml-2">100%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state for weekly/special tabs */}
      {filteredTasks.length === 0 && (
        <div className="card-telegram min-h-[180px] flex flex-col items-center justify-center">
          <span className="text-5xl mb-3">📋</span>
          <p className="text-muted-foreground text-sm">No tasks available</p>
        </div>
      )}
    </div>
  );
};
