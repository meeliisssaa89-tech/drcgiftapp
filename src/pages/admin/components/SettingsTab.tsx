import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Coins, Wallet, Settings2, X } from 'lucide-react';
import { DbGameSetting } from '@/hooks/useAdminData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const handleChange = (settingId: string, key: string, value: string | number | boolean) => {
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

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      spin_cost: 'Spin Cost',
      daily_free_spins: 'Daily Free Spins',
      referral_reward: 'Referral Reward',
      starting_crystals: 'Starting Crystals',
      level_xp_multiplier: 'Level XP Multiplier',
      currency: 'Currency Settings',
      web3: 'Web3 & Deposits',
      ton_deposit: 'TON Wallet Deposits',
      telegram_stars: 'Telegram Stars',
    };
    return labels[key] || key.replace(/_/g, ' ');
  };

  const getSettingIcon = (key: string) => {
    switch (key) {
      case 'currency':
        return <Coins className="w-5 h-5 text-primary" />;
      case 'web3':
        return <Wallet className="w-5 h-5 text-purple-400" />;
      case 'ton_deposit':
        return <Wallet className="w-5 h-5 text-blue-400" />;
      case 'telegram_stars':
        return <span className="text-xl">⭐</span>;
      default:
        return <Settings2 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleClearField = (settingId: string, key: string) => {
    const current = editedValues[settingId] ?? settings.find(s => s.id === settingId)?.value ?? {};
    setEditedValues({
      ...editedValues,
      [settingId]: { ...current, [key]: '' },
    });
  };

  const renderCurrencySettings = (setting: DbGameSetting) => {
    const value = getEditedValue(setting) as Record<string, unknown>;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency Name</Label>
            <Input
              value={(value.name as string) || ''}
              onChange={(e) => handleChange(setting.id, 'name', e.target.value)}
              placeholder="Crystals"
            />
          </div>
          <div className="space-y-2">
            <Label>Symbol/Emoji</Label>
            <div className="flex gap-2">
              <Input
                value={(value.symbol as string) || ''}
                onChange={(e) => handleChange(setting.id, 'symbol', e.target.value)}
                placeholder="💎"
                className="flex-1"
              />
              {(value.symbol as string) && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleClearField(setting.id, 'symbol')}
                  title="Clear symbol"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Icon URL (optional)</Label>
          <div className="flex gap-2">
            <Input
              value={(value.icon_url as string) || ''}
              onChange={(e) => handleChange(setting.id, 'icon_url', e.target.value)}
              placeholder="https://example.com/icon.png"
              className="flex-1"
            />
            {(value.icon_url as string) && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleClearField(setting.id, 'icon_url')}
                title="Clear icon URL"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {(value.icon_url as string) && (
            <div className="flex items-center gap-2 mt-2">
              <img 
                src={value.icon_url as string} 
                alt="Preview" 
                className="w-8 h-8 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-muted-foreground">Icon preview</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Exchange Rate</Label>
            <Input
              type="number"
              value={(value.exchange_rate as number) || 1}
              onChange={(e) => handleChange(setting.id, 'exchange_rate', parseFloat(e.target.value) || 1)}
              min="0.0001"
              step="0.0001"
            />
            <p className="text-xs text-muted-foreground">1 token = X crystals</p>
          </div>
          <div className="space-y-2">
            <Label>Min Deposit</Label>
            <Input
              type="number"
              value={(value.min_deposit as number) || 0}
              onChange={(e) => handleChange(setting.id, 'min_deposit', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Deposit</Label>
            <Input
              type="number"
              value={(value.max_deposit as number) || 0}
              onChange={(e) => handleChange(setting.id, 'max_deposit', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Deposit Instructions</Label>
          <Input
            value={(value.deposit_instructions as string) || ''}
            onChange={(e) => handleChange(setting.id, 'deposit_instructions', e.target.value)}
            placeholder="Connect your wallet to deposit tokens"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={(value.deposit_enabled as boolean) || false}
            onCheckedChange={(checked) => handleChange(setting.id, 'deposit_enabled', checked)}
          />
          <Label>Enable Deposits</Label>
        </div>
      </div>
    );
  };

  const renderWeb3Settings = (setting: DbGameSetting) => {
    const value = getEditedValue(setting) as Record<string, unknown>;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Switch
            checked={(value.enabled as boolean) || false}
            onCheckedChange={(checked) => handleChange(setting.id, 'enabled', checked)}
          />
          <Label>Enable Web3 Deposits</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Chain</Label>
            <Select
              value={String((value.chain_id as number) || 1)}
              onValueChange={(v) => {
                const chainId = parseInt(v);
                const chainNames: Record<number, string> = {
                  1: 'Ethereum',
                  56: 'BNB Chain',
                  137: 'Polygon',
                  42161: 'Arbitrum',
                };
                handleChange(setting.id, 'chain_id', chainId);
                handleChange(setting.id, 'chain_name', chainNames[chainId] || 'Unknown');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Ethereum</SelectItem>
                <SelectItem value="56">BNB Chain</SelectItem>
                <SelectItem value="137">Polygon</SelectItem>
                <SelectItem value="42161">Arbitrum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Token Symbol</Label>
            <Input
              value={(value.token_symbol as string) || ''}
              onChange={(e) => handleChange(setting.id, 'token_symbol', e.target.value)}
              placeholder="ETH"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Deposit Address</Label>
          <Input
            value={(value.deposit_address as string) || ''}
            onChange={(e) => handleChange(setting.id, 'deposit_address', e.target.value)}
            placeholder="0x..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Wallet address to receive deposits
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Token Address (optional)</Label>
            <Input
              value={(value.token_address as string) || ''}
              onChange={(e) => handleChange(setting.id, 'token_address', e.target.value)}
              placeholder="0x... (leave empty for native token)"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Token Decimals</Label>
            <Input
              type="number"
              value={(value.token_decimals as number) || 18}
              onChange={(e) => handleChange(setting.id, 'token_decimals', parseInt(e.target.value) || 18)}
              min="0"
              max="18"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTonSettings = (setting: DbGameSetting) => {
    const value = getEditedValue(setting) as Record<string, unknown>;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Switch
            checked={(value.enabled as boolean) || false}
            onCheckedChange={(checked) => handleChange(setting.id, 'enabled', checked)}
          />
          <Label>Enable TON Deposits</Label>
        </div>
        
        <div className="space-y-2">
          <Label>TON Deposit Address</Label>
          <Input
            value={(value.deposit_address as string) || ''}
            onChange={(e) => handleChange(setting.id, 'deposit_address', e.target.value)}
            placeholder="UQ... or EQ..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your TON wallet address to receive deposits
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Exchange Rate</Label>
            <Input
              type="number"
              value={(value.exchange_rate as number) || 100}
              onChange={(e) => handleChange(setting.id, 'exchange_rate', parseFloat(e.target.value) || 100)}
              min="0.01"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">1 TON = X crystals</p>
          </div>
          <div className="space-y-2">
            <Label>Min Deposit (TON)</Label>
            <Input
              type="number"
              value={(value.min_deposit as number) || 0.1}
              onChange={(e) => handleChange(setting.id, 'min_deposit', parseFloat(e.target.value) || 0.1)}
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Deposit (TON)</Label>
            <Input
              type="number"
              value={(value.max_deposit as number) || 1000}
              onChange={(e) => handleChange(setting.id, 'max_deposit', parseInt(e.target.value) || 1000)}
              min="1"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTelegramStarsSettings = (setting: DbGameSetting) => {
    const value = getEditedValue(setting) as Record<string, unknown>;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Switch
            checked={(value.enabled as boolean) || false}
            onCheckedChange={(checked) => handleChange(setting.id, 'enabled', checked)}
          />
          <Label>Enable Telegram Stars</Label>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Exchange Rate</Label>
            <Input
              type="number"
              value={(value.exchange_rate as number) || 10}
              onChange={(e) => handleChange(setting.id, 'exchange_rate', parseFloat(e.target.value) || 10)}
              min="0.01"
              step="0.01"
            />
            <p className="text-xs text-muted-foreground">1 ⭐ = X crystals</p>
          </div>
          <div className="space-y-2">
            <Label>Min Deposit (⭐)</Label>
            <Input
              type="number"
              value={(value.min_deposit as number) || 10}
              onChange={(e) => handleChange(setting.id, 'min_deposit', parseInt(e.target.value) || 10)}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Max Deposit (⭐)</Label>
            <Input
              type="number"
              value={(value.max_deposit as number) || 10000}
              onChange={(e) => handleChange(setting.id, 'max_deposit', parseInt(e.target.value) || 10000)}
              min="1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={(value.gift_enabled as boolean) || false}
            onCheckedChange={(checked) => handleChange(setting.id, 'gift_enabled', checked)}
          />
          <Label>Enable Gift Sending</Label>
        </div>
      </div>
    );
  };

  const renderSettingInput = (setting: DbGameSetting) => {
    // Special rendering for currency and web3 settings
    if (setting.key === 'currency') {
      return renderCurrencySettings(setting);
    }
    if (setting.key === 'web3') {
      return renderWeb3Settings(setting);
    }
    if (setting.key === 'ton_deposit') {
      return renderTonSettings(setting);
    }
    if (setting.key === 'telegram_stars') {
      return renderTelegramStarsSettings(setting);
    }

    // Default rendering for other settings
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

  // Sort settings to show currency, telegram_stars, ton_deposit, and web3 first
  const sortedSettings = [...settings].sort((a, b) => {
    const order = ['currency', 'telegram_stars', 'ton_deposit', 'web3'];
    const aIndex = order.indexOf(a.key);
    const bIndex = order.indexOf(b.key);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.key.localeCompare(b.key);
  });

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg">Game Settings</h2>

      <div className="grid gap-4">
        {sortedSettings.map((setting) => (
          <div key={setting.id} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getSettingIcon(setting.key)}
                </div>
                <div className="space-y-2 flex-1">
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
