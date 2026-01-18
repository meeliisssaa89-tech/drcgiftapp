import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Gift, Crown, Upload, X, Image } from 'lucide-react';
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
import { DbGiveaway } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GiveawaysTabProps {
  giveaways: DbGiveaway[];
  onCreate: (giveaway: Partial<DbGiveaway>) => Promise<unknown>;
  onUpdate: (id: string, updates: Partial<DbGiveaway>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

// Extended giveaway type with telegram fields
interface ExtendedGiveaway extends DbGiveaway {
  telegram_gift_id?: string | null;
  telegram_gift_months?: number | null;
  telegram_gift_message?: string | null;
  gift_image_url?: string | null;
}

export const GiveawaysTab = ({ giveaways, onCreate, onUpdate, onDelete }: GiveawaysTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<ExtendedGiveaway | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emoji: '🎁',
    prize_amount: 100,
    prize_type: 'crystals',
    max_participants: null as number | null,
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    is_active: true,
    // Telegram gift fields
    telegram_gift_id: '',
    telegram_gift_months: 3,
    telegram_gift_message: '',
    gift_image_url: '',
  });

  const openCreate = () => {
    setEditingGiveaway(null);
    setFormData({
      title: '',
      description: '',
      emoji: '🎁',
      prize_amount: 100,
      prize_type: 'crystals',
      max_participants: null,
      start_at: new Date().toISOString().slice(0, 16),
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      is_active: true,
      telegram_gift_id: '',
      telegram_gift_months: 3,
      telegram_gift_message: '',
      gift_image_url: '',
    });
    setIsDialogOpen(true);
  };

  const openEdit = (giveaway: ExtendedGiveaway) => {
    setEditingGiveaway(giveaway);
    setFormData({
      title: giveaway.title,
      description: giveaway.description,
      emoji: giveaway.emoji,
      prize_amount: giveaway.prize_amount,
      prize_type: giveaway.prize_type,
      max_participants: giveaway.max_participants,
      start_at: new Date(giveaway.start_at).toISOString().slice(0, 16),
      end_at: new Date(giveaway.end_at).toISOString().slice(0, 16),
      is_active: giveaway.is_active,
      telegram_gift_id: giveaway.telegram_gift_id || '',
      telegram_gift_months: giveaway.telegram_gift_months || 3,
      telegram_gift_message: giveaway.telegram_gift_message || '',
      gift_image_url: giveaway.gift_image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gifts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gifts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('gifts')
        .getPublicUrl(filePath);

      setFormData({ ...formData, gift_image_url: urlData.publicUrl });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, gift_image_url: '' });
  };

  const handleSave = async () => {
    const data: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      emoji: formData.emoji,
      prize_amount: formData.prize_amount,
      prize_type: formData.prize_type,
      max_participants: formData.max_participants,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
      is_active: formData.is_active,
      gift_image_url: formData.gift_image_url || null,
    };

    // Add telegram gift fields if prize type is telegram
    if (formData.prize_type === 'telegram_premium' || formData.prize_type === 'telegram_gift') {
      data.telegram_gift_id = formData.telegram_gift_id || null;
      data.telegram_gift_months = formData.telegram_gift_months;
      data.telegram_gift_message = formData.telegram_gift_message || null;
    }
    
    if (editingGiveaway) {
      await onUpdate(editingGiveaway.id, data as Partial<DbGiveaway>);
    } else {
      await onCreate(data as Partial<DbGiveaway>);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (giveaway: DbGiveaway) => {
    if (!confirm(`Delete giveaway "${giveaway.title}"?`)) return;
    await onDelete(giveaway.id);
  };

  const handleToggleActive = async (giveaway: DbGiveaway) => {
    await onUpdate(giveaway.id, { is_active: !giveaway.is_active });
  };

  const getStatus = (giveaway: DbGiveaway) => {
    const now = new Date();
    const start = new Date(giveaway.start_at);
    const end = new Date(giveaway.end_at);
    
    if (!giveaway.is_active) return { text: 'Inactive', color: 'bg-muted text-muted-foreground' };
    if (now < start) return { text: 'Upcoming', color: 'bg-blue-500/20 text-blue-500' };
    if (now > end) return { text: 'Ended', color: 'bg-orange-500/20 text-orange-500' };
    return { text: 'Active', color: 'bg-green-500/20 text-green-500' };
  };

  const getPrizeIcon = (prizeType: string) => {
    switch (prizeType) {
      case 'telegram_premium':
        return <Crown className="w-4 h-4 text-purple-400" />;
      case 'telegram_gift':
        return <Gift className="w-4 h-4 text-pink-400" />;
      default:
        return '💎';
    }
  };

  const getPrizeLabel = (prizeType: string) => {
    switch (prizeType) {
      case 'telegram_premium':
        return 'Telegram Premium';
      case 'telegram_gift':
        return 'Telegram Gift';
      case 'crystals':
        return 'Crystals';
      default:
        return prizeType;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Giveaways ({giveaways.length})</h2>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Giveaway
        </Button>
      </div>

      {/* Giveaways Grid */}
      <div className="grid gap-3">
        {giveaways.map((giveaway) => {
          const status = getStatus(giveaway);
          return (
            <div 
              key={giveaway.id} 
              className={`bg-card rounded-xl p-4 border border-border ${!giveaway.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{giveaway.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{giveaway.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{giveaway.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Prize: {giveaway.prize_amount} {getPrizeIcon(giveaway.prize_type)}
                        <span className="ml-1">{getPrizeLabel(giveaway.prize_type)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {giveaway.current_participants}{giveaway.max_participants ? `/${giveaway.max_participants}` : ''} joined
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(giveaway.start_at).toLocaleDateString()} - {new Date(giveaway.end_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={giveaway.is_active}
                    onCheckedChange={() => handleToggleActive(giveaway)}
                  />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(giveaway as ExtendedGiveaway)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => handleDelete(giveaway)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {giveaways.length === 0 && (
          <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground">
            No giveaways yet
          </div>
        )}
      </div>

      {/* Giveaway Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGiveaway ? 'Edit Giveaway' : 'Create Giveaway'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-3">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Giveaway title"
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
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Giveaway description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prize Type</Label>
                <Select 
                  value={formData.prize_type} 
                  onValueChange={(v) => setFormData({ ...formData, prize_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crystals">💎 Crystals</SelectItem>
                    <SelectItem value="telegram_premium">👑 Telegram Premium</SelectItem>
                    <SelectItem value="telegram_gift">🎁 Telegram Gift</SelectItem>
                    <SelectItem value="gift">🎀 Physical Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prize Amount</Label>
                <Input
                  type="number"
                  value={formData.prize_amount}
                  onChange={(e) => setFormData({ ...formData, prize_amount: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            {/* Gift Image Upload */}
            <div className="space-y-2">
              <Label>Gift Image (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {formData.gift_image_url ? (
                <div className="relative w-full aspect-video bg-secondary rounded-xl overflow-hidden">
                  <img
                    src={formData.gift_image_url}
                    alt="Gift preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <span>Uploading...</span>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Upload Gift Image</span>
                    </>
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Max size: 2MB. Recommended: 512x512px
              </p>
            </div>

            {/* Telegram Gift Fields */}
            {(formData.prize_type === 'telegram_premium' || formData.prize_type === 'telegram_gift') && (
              <div className="space-y-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <h4 className="font-medium text-purple-400 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Telegram Gift Settings
                </h4>
                
                {formData.prize_type === 'telegram_premium' && (
                  <div className="space-y-2">
                    <Label>Premium Duration (months)</Label>
                    <Select 
                      value={formData.telegram_gift_months.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, telegram_gift_months: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months (1000 ⭐)</SelectItem>
                        <SelectItem value="6">6 months (1500 ⭐)</SelectItem>
                        <SelectItem value="12">12 months (2500 ⭐)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.prize_type === 'telegram_gift' && (
                  <div className="space-y-2">
                    <Label>Gift ID (from Telegram)</Label>
                    <Input
                      value={formData.telegram_gift_id}
                      onChange={(e) => setFormData({ ...formData, telegram_gift_id: e.target.value })}
                      placeholder="e.g., gift_abc123"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get gift IDs from Telegram Bot API getAvailableGifts
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Gift Message (optional)</Label>
                  <Input
                    value={formData.telegram_gift_message}
                    onChange={(e) => setFormData({ ...formData, telegram_gift_message: e.target.value })}
                    placeholder="Congratulations! 🎉"
                    maxLength={128}
                  />
                  <p className="text-xs text-muted-foreground">
                    Message shown with the gift (max 128 chars)
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Max Participants (optional)</Label>
              <Input
                type="number"
                value={formData.max_participants ?? ''}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Unlimited"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
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
