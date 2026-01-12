import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import { DbPrize } from '@/hooks/useAdminData';

interface PrizesTabProps {
  prizes: DbPrize[];
  onCreate: (prize: Partial<DbPrize>) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<DbPrize>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const PrizesTab = ({ prizes, onCreate, onUpdate, onDelete }: PrizesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<DbPrize | null>(null);
  const [formData, setFormData] = useState({
    prize_key: '',
    name: '',
    emoji: '🎁',
    value: 10,
    probability: 10,
    type: 'gift',
    is_active: true,
    sort_order: 0,
  });

  const totalProbability = prizes
    .filter(p => p.is_active)
    .reduce((sum, p) => sum + Number(p.probability), 0);

  const openCreate = () => {
    setEditingPrize(null);
    setFormData({
      prize_key: '',
      name: '',
      emoji: '🎁',
      value: 10,
      probability: 10,
      type: 'gift',
      is_active: true,
      sort_order: prizes.length + 1,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (prize: DbPrize) => {
    setEditingPrize(prize);
    setFormData({
      prize_key: prize.prize_key,
      name: prize.name,
      emoji: prize.emoji,
      value: prize.value,
      probability: prize.probability,
      type: prize.type,
      is_active: prize.is_active,
      sort_order: prize.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingPrize) {
      await onUpdate(editingPrize.id, formData);
    } else {
      await onCreate(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (prize: DbPrize) => {
    if (!confirm(`Delete prize "${prize.name}"?`)) return;
    await onDelete(prize.id);
  };

  const handleToggleActive = async (prize: DbPrize) => {
    await onUpdate(prize.id, { is_active: !prize.is_active });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Prizes ({prizes.length})</h2>
          <p className={`text-sm ${Math.abs(totalProbability - 100) > 0.1 ? 'text-destructive' : 'text-muted-foreground'}`}>
            Total Probability: {totalProbability.toFixed(2)}% {Math.abs(totalProbability - 100) > 0.1 && '(should be 100%)'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Prize
        </Button>
      </div>

      {/* Prizes Grid */}
      <div className="grid gap-3">
        {prizes.map((prize) => (
          <div 
            key={prize.id} 
            className={`bg-card rounded-xl p-4 border border-border ${!prize.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{prize.emoji}</span>
                <div>
                  <h3 className="font-semibold">{prize.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {prize.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Value: {prize.value} • Prob: {prize.probability}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={prize.is_active}
                  onCheckedChange={() => handleToggleActive(prize)}
                />
                <Button size="sm" variant="ghost" onClick={() => openEdit(prize)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={() => handleDelete(prize)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {prizes.length === 0 && (
          <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground">
            No prizes yet
          </div>
        )}
      </div>

      {/* Prize Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrize ? 'Edit Prize' : 'Create Prize'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prize Key</Label>
                <Input
                  value={formData.prize_key}
                  onChange={(e) => setFormData({ ...formData, prize_key: e.target.value })}
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
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Prize name"
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
                    <SelectItem value="crystals">Crystals</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Probability (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
              />
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
