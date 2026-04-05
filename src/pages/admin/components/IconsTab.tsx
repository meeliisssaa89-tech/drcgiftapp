import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Image, Smile, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AppIcon {
  id: string;
  icon_key: string;
  label: string;
  icon_type: 'emoji' | 'gif' | 'sticker';
  emoji_value: string | null;
  gif_url: string | null;
  sticker_url: string | null;
}

export const IconsTab = () => {
  const [icons, setIcons] = useState<AppIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<AppIcon>>>({});

  const fetchIcons = async () => {
    const { data, error } = await supabase
      .from('app_icons')
      .select('*')
      .order('icon_key');

    if (error) {
      console.error('Error fetching icons:', error);
      return;
    }
    setIcons(data as AppIcon[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  const getEdit = (icon: AppIcon) => ({
    ...icon,
    ...edits[icon.id],
  });

  const handleChange = (iconId: string, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [iconId]: { ...prev[iconId], [field]: value },
    }));
  };

  const handleSave = async (icon: AppIcon) => {
    const edit = edits[icon.id];
    if (!edit) return;

    setSaving(icon.id);
    const { error } = await supabase
      .from('app_icons')
      .update({
        icon_type: edit.icon_type ?? icon.icon_type,
        emoji_value: edit.emoji_value ?? icon.emoji_value,
        gif_url: edit.gif_url ?? icon.gif_url,
        sticker_url: edit.sticker_url ?? icon.sticker_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', icon.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Icon updated');
      await fetchIcons();
      const { [icon.id]: _, ...rest } = edits;
      setEdits(rest);
    }
    setSaving(null);
  };

  const renderPreview = (icon: AppIcon) => {
    const current = getEdit(icon);
    if (current.icon_type === 'gif' && current.gif_url) {
      return <img src={current.gif_url} alt={current.label} className="w-10 h-10 object-contain rounded" />;
    }
    if (current.icon_type === 'sticker' && current.sticker_url) {
      return <img src={current.sticker_url} alt={current.label} className="w-10 h-10 object-contain" />;
    }
    return <span className="text-2xl">{current.emoji_value || '❓'}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">App Icons</h2>
        <p className="text-xs text-muted-foreground">Change any icon to emoji, GIF, or Telegram sticker</p>
      </div>

      <div className="grid gap-3">
        {icons.map((icon) => {
          const current = getEdit(icon);
          const hasChanges = !!edits[icon.id];

          return (
            <div key={icon.id} className="bg-card rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    {renderPreview(icon)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{icon.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{icon.icon_key}</p>
                  </div>
                </div>
                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={() => handleSave(icon)}
                    disabled={saving === icon.id}
                  >
                    {saving === icon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={current.icon_type}
                    onValueChange={(v) => handleChange(icon.id, 'icon_type', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emoji">
                        <span className="flex items-center gap-2"><Smile className="w-3 h-3" /> Emoji</span>
                      </SelectItem>
                      <SelectItem value="gif">
                        <span className="flex items-center gap-2"><Film className="w-3 h-3" /> GIF</span>
                      </SelectItem>
                      <SelectItem value="sticker">
                        <span className="flex items-center gap-2"><Image className="w-3 h-3" /> Sticker</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {current.icon_type === 'emoji' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Emoji</Label>
                    <Input
                      value={current.emoji_value || ''}
                      onChange={(e) => handleChange(icon.id, 'emoji_value', e.target.value)}
                      placeholder="💎"
                      className="h-9"
                    />
                  </div>
                )}

                {current.icon_type === 'gif' && (
                  <div className="space-y-1">
                    <Label className="text-xs">GIF URL</Label>
                    <Input
                      value={current.gif_url || ''}
                      onChange={(e) => handleChange(icon.id, 'gif_url', e.target.value)}
                      placeholder="https://..."
                      className="h-9"
                    />
                  </div>
                )}

                {current.icon_type === 'sticker' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Sticker URL</Label>
                    <Input
                      value={current.sticker_url || ''}
                      onChange={(e) => handleChange(icon.id, 'sticker_url', e.target.value)}
                      placeholder="https://..."
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
