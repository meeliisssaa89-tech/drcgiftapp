import { useState } from 'react';
import { X, Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useTonDeposit } from '@/hooks/useTonDeposit';
import { CrystalIcon } from './CrystalIcon';
import { cn } from '@/lib/utils';

interface TonDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TonDepositModal = ({ isOpen, onClose }: TonDepositModalProps) => {
  const {
    isConnected,
    wallet,
    address,
    settings,
    connectWallet,
    disconnectWallet,
    deposit,
    isDepositing,
  } = useTonDeposit();

  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const quickAmounts = [1, 5, 10, 50];
  const crystalsToReceive = parseFloat(amount) * (settings?.exchange_rate || 100) || 0;

  const handleDeposit = async () => {
    if (!amount) return;
    const hash = await deposit(amount);
    if (hash) {
      setTxHash(hash);
      setAmount('');
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Deposit TON</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Connect TON Wallet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your TON wallet to deposit and receive crystals
              </p>
              <button 
                onClick={connectWallet}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.0001 2C6.47715 2 2.00006 6.47715 2.00006 12C2.00006 17.5228 6.47715 22 12.0001 22C17.5229 22 22.0001 17.5228 22.0001 12C22.0001 6.47715 17.5229 2 12.0001 2ZM9.00006 8.5L12.0001 5.5L15.0001 8.5L12.0001 11.5L9.00006 8.5ZM12.0001 12.5L15.0001 15.5L12.0001 18.5L9.00006 15.5L12.0001 12.5Z"/>
                </svg>
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Connected Wallet Info */}
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">TON Wallet</p>
                  <p className="text-xs text-muted-foreground">{formatAddress(address || '')}</p>
                </div>
              </div>
              <button 
                onClick={disconnectWallet}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={settings?.min_deposit || 0.1}
                  max={settings?.max_deposit || 1000}
                  step="0.01"
                  className="w-full bg-secondary rounded-xl px-4 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  TON
                </span>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      amount === quickAmount.toString()
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {quickAmount} TON
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Preview */}
            {parseFloat(amount) > 0 && (
              <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm">You will receive:</span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-lg">{Math.floor(crystalsToReceive).toLocaleString()}</span>
                  <CrystalIcon size={20} />
                </div>
              </div>
            )}

            {/* Limits Info */}
            <div className="text-xs text-muted-foreground text-center">
              Min: {settings?.min_deposit || 0.1} TON • Max: {settings?.max_deposit || 1000} TON
            </div>

            {/* Deposit Button */}
            <button
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || isDepositing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDepositing ? (
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

            {/* Transaction Success */}
            {txHash && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-sm text-green-500 font-medium mb-2">Transaction Submitted!</p>
                <a
                  href={`https://tonviewer.com/transaction/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
