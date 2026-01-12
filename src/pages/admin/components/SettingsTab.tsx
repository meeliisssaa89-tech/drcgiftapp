import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { DbGameSetting } from '@/hooks/useAdminData';

interface SettingsTabProps {
  settings: DbGameSetting[];
  onUpdate: (id: string, value: Record<string, unknown>) => Promise<boolean>;
}

export const SettingsTab = ({ settings, onUpdate }: SettingsTabProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, unknown>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getEditedValue = (setting: DbGameSetting) => {
    return editedValues[setting.id] ?? setting.value;
  };

  const handleChange = (settingId: string, key: string, value: string | number) => {
    const current = editedValues[settingId] ?? settings.find(s => s.id === settingId)?.value ?? {};
    setEditedValues({
      ...editedValues,
      [settingId]: { ...current, [key]: value },
    });
  };

  const handleSave = async (setting: DbGameSetting) => {
    const newValue = editedValues[setting.id];
    if (!newValue) return;
    
    setSaving(setting.id);
    await onUpdate(setting.id, newValue);
    setSaving(null);
    
    // Clear from edited values after save
    const { [setting.id]: _, ...rest } = editedValues;
    setEditedValues(rest);
  };

  const hasChanges = (settingId: string) => {
    return !!editedValues[settingId];
  };

  const renderSettingInput = (setting: DbGameSetting) => {
    const value = getEditedValue(setting);
    const keys = Object.keys(value);
    
    return (
      <div className="space-y-3">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <Label className="min-w-[100px] text-muted-foreground capitalize">
              {key.replace(/_/g, ' ')}
            </Label>
            <Input
              type={typeof value[key] === 'number' ? 'number' : 'text'}
              value={value[key] as string | number}
              onChange={(e) => {
                const newVal = typeof value[key] === 'number' 
                  ? parseFloat(e.target.value) || 0 
                  : e.target.value;
                handleChange(setting.id, key, newVal);
              }}
              className="max-w-[200px]"
            />
          </div>
        ))}
      </div>
    );
  };

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      spin_cost: 'Spin Cost',
      daily_free_spins: 'Daily Free Spins',
      referral_reward: 'Referral Reward',
      starting_crystals: 'Starting Crystals',
      level_xp_multiplier: 'Level XP Multiplier',
    };
    return labels[key] || key.replace(/_/g, ' ');
  };

  const getSettingIcon = (key: string) => {
    const icons: Record<string, string> = {
      spin_cost: '🎰',
      daily_free_spins: '🎫',
      referral_reward: '👥',
      starting_crystals: '💎',
      level_xp_multiplier: '📊',
    };
    return icons[key] || '⚙️';
  };

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Game Settings</h2>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <div key={setting.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getSettingIcon(setting.key)}</span>
                <div className="space-y-2">
                  <h3 className="font-semibold">{getSettingLabel(setting.key)}</h3>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  )}
                  <div className="pt-2">
                    {renderSettingInput(setting)}
                  </div>
                </div>
              </div>
              {hasChanges(setting.id) && (
                <Button 
                  size="sm" 
                  onClick={() => handleSave(setting)}
                  disabled={saving === setting.id}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving === setting.id ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {settings.length === 0 && (
          <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground">
            No settings configured
          </div>
        )}
      </div>
    </div>
  );
};
