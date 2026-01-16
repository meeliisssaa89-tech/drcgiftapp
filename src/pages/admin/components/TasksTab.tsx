import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Play, Users, Share2, Gift, ExternalLink, Clipboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DbTask } from '@/hooks/useAdminData';

interface TasksTabProps {
  tasks: DbTask[];
  onCreate: (task: Partial<DbTask>) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<DbTask>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const ACTION_TYPES = [
  { value: 'manual', label: 'Manual', icon: Clipboard, description: 'User marks as complete manually' },
  { value: 'play_games', label: 'Play Games', icon: Play, description: 'Auto-tracks games played' },
  { value: 'invite', label: 'Invite Friends', icon: Users, description: 'Invite friends to join' },
  { value: 'share', label: 'Share', icon: Share2, description: 'Share to stories/social' },
  { value: 'claim_daily', label: 'Daily Claim', icon: Gift, description: 'One-click daily reward' },
  { value: 'external_link', label: 'External Link', icon: ExternalLink, description: 'Opens a URL' },
];

const getActionIcon = (actionType: string) => {
  const action = ACTION_TYPES.find(a => a.value === actionType);
  if (!action) return null;
  const Icon = action.icon;
  return <Icon className="w-3.5 h-3.5" />;
};

export const TasksTab = ({ tasks, onCreate, onUpdate, onDelete }: TasksTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DbTask | null>(null);
  const [formData, setFormData] = useState({
    task_key: '',
    title: '',
    description: '',
    emoji: '📋',
    reward: 10,
    max_progress: 1,
    type: 'daily',
    is_active: true,
    timer_hours: null as number | null,
    sort_order: 0,
    action_type: 'manual',
    action_url: '' as string | null,
  });

  const openCreate = () => {
    setEditingTask(null);
    setFormData({
      task_key: '',
      title: '',
      description: '',
      emoji: '📋',
      reward: 10,
      max_progress: 1,
      type: 'daily',
      is_active: true,
      timer_hours: null,
      sort_order: tasks.length + 1,
      action_type: 'manual',
      action_url: '',
    });
    setIsDialogOpen(true);
  };

  const openEdit = (task: DbTask) => {
    setEditingTask(task);
    setFormData({
      task_key: task.task_key,
      title: task.title,
      description: task.description,
      emoji: task.emoji,
      reward: task.reward,
      max_progress: task.max_progress,
      type: task.type,
      is_active: task.is_active,
      timer_hours: task.timer_hours,
      sort_order: task.sort_order,
      action_type: task.action_type || 'manual',
      action_url: task.action_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      action_url: formData.action_url || null,
    };
    
    if (editingTask) {
      await onUpdate(editingTask.id, dataToSave);
    } else {
      await onCreate(dataToSave);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (task: DbTask) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await onDelete(task.id);
  };

  const handleToggleActive = async (task: DbTask) => {
    await onUpdate(task.id, { is_active: !task.is_active });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Tasks ({tasks.length})</h2>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`bg-card rounded-xl p-4 border border-border ${!task.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{task.emoji}</span>
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {task.type}
                    </span>
                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                      {getActionIcon(task.action_type || 'manual')}
                      {task.action_type || 'manual'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      +{task.reward} 💎 • {task.max_progress} steps
                    </span>
                    {task.timer_hours && (
                      <span className="text-xs text-muted-foreground">
                        ⏱️ {task.timer_hours}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={task.is_active}
                  onCheckedChange={() => handleToggleActive(task)}
                />
                <Button size="sm" variant="ghost" onClick={() => openEdit(task)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={() => handleDelete(task)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground">
            No tasks yet
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Task Key</Label>
                <Input
                  value={formData.task_key}
                  onChange={(e) => setFormData({ ...formData, task_key: e.target.value })}
                  placeholder="unique_key"
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select 
                  value={formData.action_type} 
                  onValueChange={(v) => setFormData({ ...formData, action_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center gap-2">
                          <action.icon className="w-4 h-4" />
                          <span>{action.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.action_type === 'external_link' && (
              <div className="space-y-2">
                <Label>Action URL</Label>
                <Input
                  value={formData.action_url || ''}
                  onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reward 💎</Label>
                <Input
                  type="number"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Progress</Label>
                <Input
                  type="number"
                  value={formData.max_progress}
                  onChange={(e) => setFormData({ ...formData, max_progress: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timer (hours)</Label>
                <Input
                  type="number"
                  value={formData.timer_hours ?? ''}
                  onChange={(e) => setFormData({ ...formData, timer_hours: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
