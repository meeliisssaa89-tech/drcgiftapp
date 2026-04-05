import { useState } from 'react';
import { X, Wallet, Loader2, Star } from 'lucide-react';
import { useTonDeposit } from '@/hooks/useTonDeposit';
import { useTelegramStars } from '@/hooks/useTelegramStars';
import { CrystalIcon } from './CrystalIcon';
import { cn } from '@/lib/utils';

type DepositMethod = 'stars' | 'ton';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal = ({ isOpen, onClose }: DepositModalProps) => {
  const [activeMethod, setActiveMethod] = useState<DepositMethod>('stars');
  const [starsAmount, setStarsAmount] = useState('');
  const [tonAmount, setTonAmount] = useState('');

  const {
    isConnected: tonConnected,
    address: tonAddress,
    settings: tonSettings,
    connectWallet: connectTon,
    disconnectWallet: disconnectTon,
    deposit: depositTon,
    isDepositing: isTonDepositing,
  } = useTonDeposit();

  const {
    settings: starsSettings,
    isProcessing: isStarsProcessing,
    purchaseStars,
    isTelegram,
  } = useTelegramStars();

  const quickStarsAmounts = [50, 100, 250, 500];
  const quickTonAmounts = [1, 5, 10, 50];

  const starsToReceive = parseInt(starsAmount) * (starsSettings?.exchange_rate || 10) || 0;
  const tonToReceive = parseFloat(tonAmount) * (tonSettings?.exchange_rate || 100) || 0;

  const handleStarsDeposit = async () => {
    const amount = parseInt(starsAmount);
    if (!amount) return;
    const success = await purchaseStars(amount);
    if (success) {
      setStarsAmount('');
    }
  };

  const handleTonDeposit = async () => {
    if (!tonAmount) return;
    await depositTon(tonAmount);
    setTonAmount('');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">💎 Top Up</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveMethod('stars')}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              activeMethod === 'stars'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <Star className="w-4 h-4" />
            Stars
          </button>
          <button
            onClick={() => setActiveMethod('ton')}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              activeMethod === 'ton'
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <Wallet className="w-4 h-4" />
            TON
          </button>
        </div>

        {/* Stars Deposit */}
        {activeMethod === 'stars' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 text-center">
              <Star className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
              <h3 className="font-semibold">Telegram Stars</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pay with Telegram Stars to get crystals instantly
              </p>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Amount (Stars)</label>
              <div className="relative">
                <input
                  type="number"
                  value={starsAmount}
                  onChange={(e) => setStarsAmount(e.target.value)}
                  placeholder="0"
                  min={starsSettings?.min_deposit || 10}
                  max={starsSettings?.max_deposit || 10000}
                  className="w-full bg-secondary rounded-xl px-4 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Star className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickStarsAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setStarsAmount(amount.toString())}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      starsAmount === amount.toString()
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {amount} ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Preview */}
            {parseInt(starsAmount) > 0 && (
              <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm">You will receive:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-lg">{Math.floor(starsToReceive).toLocaleString()}</span>
                  <CrystalIcon size={20} />
                </div>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground text-center">
              {starsSettings?.min_deposit && starsSettings?.max_deposit && (
                <>Min: {starsSettings.min_deposit} ⭐ • Max: {starsSettings.max_deposit} ⭐</>
              )}
            </div>

            {/* Deposit Button */}
            <button
              onClick={handleStarsDeposit}
              disabled={!starsAmount || parseInt(starsAmount) <= 0 || isStarsProcessing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isStarsProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  Pay with Stars
                </>
              )}
            </button>

            {!isTelegram && (
              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Demo mode - Open in Telegram for real payments
              </p>
            )}
          </div>
        )}

        {/* TON Deposit */}
        {activeMethod === 'ton' && (
          <div className="space-y-5">
            {!tonConnected ? (
              <div className="bg-secondary/50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Connect TON Wallet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your TON wallet to deposit
                </p>
                <button 
                  onClick={connectTon}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {/* Connected Wallet Info */}
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">TON Wallet</p>
                      <p className="text-xs text-muted-foreground">{formatAddress(tonAddress || '')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={disconnectTon}
                    className="text-xs text-destructive hover:underline"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Amount (TON)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tonAmount}
                      onChange={(e) => setTonAmount(e.target.value)}
                      placeholder="0.00"
                      min={tonSettings?.min_deposit || 0.1}
                      max={tonSettings?.max_deposit || 1000}
                      step="0.01"
                      className="w-full bg-secondary rounded-xl px-4 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      TON
                    </span>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {quickTonAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTonAmount(amount.toString())}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                          tonAmount === amount.toString()
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {amount} TON
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversion Preview */}
                {parseFloat(tonAmount) > 0 && (
                  <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm">You will receive:</span>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-lg">{Math.floor(tonToReceive).toLocaleString()}</span>
                      <CrystalIcon size={20} />
                    </div>
                  </div>
                )}

                {/* Limits Info */}
                <div className="text-xs text-muted-foreground text-center">
                  Min: {tonSettings?.min_deposit || 0.1} TON • Max: {tonSettings?.max_deposit || 1000} TON
                </div>

                {/* Deposit Button */}
                <button
                  onClick={handleTonDeposit}
                  disabled={!tonAmount || parseFloat(tonAmount) <= 0 || isTonDepositing}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTonDepositing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CrystalIcon size={20} />
                      Deposit Now
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
