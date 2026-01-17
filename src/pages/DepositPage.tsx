import { useState, useEffect } from 'react';
import { Wallet, ArrowDown, ExternalLink, Loader2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWeb3Deposit } from '@/hooks/useWeb3Deposit';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const DepositPage = () => {
  const {
    isConnected,
    address,
    chain,
    depositSettings,
    currencySettings,
    fetchSettings,
    connectWallet,
    disconnectWallet,
    deposit,
    recordDeposit,
    hash,
    isDepositing,
    isConfirming,
    isConfirmed,
  } = useWeb3Deposit();
  
  const { buttonPress, success, error } = useHaptics();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Record deposit when confirmed
  useEffect(() => {
    if (isConfirmed && hash && amount) {
      recordDeposit(hash, amount);
      success();
      setAmount('');
    }
  }, [isConfirmed, hash, amount, recordDeposit, success]);

  const handleConnect = () => {
    buttonPress();
    connectWallet();
  };

  const handleDisconnect = () => {
    buttonPress();
    disconnectWallet();
  };

  const handleDeposit = async () => {
    buttonPress();
    const result = await deposit(amount);
    if (!result) {
      error();
    }
  };

  const copyAddress = async () => {
    if (depositSettings?.deposit_address) {
      await navigator.clipboard.writeText(depositSettings.deposit_address);
      toast.success('Address copied!');
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!depositSettings?.enabled || !currencySettings?.deposit_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Wallet className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Deposits Coming Soon</h2>
        <p className="text-muted-foreground text-center text-sm">
          Deposit functionality is currently disabled.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Deposit {currencySettings.name}</h1>
        <p className="text-muted-foreground text-sm">
          {currencySettings.deposit_instructions}
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="card-telegram">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isConnected ? "bg-green-500/20" : "bg-secondary"
            )}>
              <Wallet className={cn(
                "w-5 h-5",
                isConnected ? "text-green-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium">
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </p>
              {isConnected && address && (
                <p className="text-xs text-muted-foreground">
                  {shortenAddress(address)} • {chain?.name}
                </p>
              )}
            </div>
          </div>
          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            onClick={isConnected ? handleDisconnect : handleConnect}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Deposit Form */}
      {isConnected && (
        <>
          {/* Deposit Address */}
          <div className="card-telegram">
            <p className="text-sm text-muted-foreground mb-2">Deposit Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-secondary rounded-lg p-3 font-mono truncate">
                {depositSettings.deposit_address}
              </code>
              <Button size="icon" variant="ghost" onClick={copyAddress}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="card-telegram space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Amount ({depositSettings.token_symbol})
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="text-xl font-bold h-14"
                min={currencySettings.min_deposit}
                max={currencySettings.max_deposit}
                step="0.001"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: {currencySettings.min_deposit}</span>
                <span>Max: {currencySettings.max_deposit}</span>
              </div>
            </div>

            {/* Conversion Preview */}
            {amount && (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{amount}</p>
                  <p className="text-xs text-muted-foreground">{depositSettings.token_symbol}</p>
                </div>
                <ArrowDown className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    {Math.floor(parseFloat(amount) * currencySettings.exchange_rate)}
                  </p>
                  <p className="text-xs text-muted-foreground">{currencySettings.name}</p>
                </div>
              </div>
            )}

            {/* Deposit Button */}
            <Button
              className="w-full h-14 text-lg"
              onClick={handleDeposit}
              disabled={!amount || isDepositing || isConfirming}
            >
              {isDepositing || isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isConfirming ? 'Confirming...' : 'Processing...'}
                </>
              ) : (
                'Deposit'
              )}
            </Button>

            {/* Transaction Status */}
            {hash && (
              <div className={cn(
                "p-3 rounded-lg text-sm",
                isConfirmed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              )}>
                <div className="flex items-center gap-2">
                  {isConfirmed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>{isConfirmed ? 'Transaction confirmed!' : 'Awaiting confirmation...'}</span>
                </div>
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs mt-1 opacity-70 hover:opacity-100"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Exchange Rate: 1 {depositSettings?.token_symbol} = {currencySettings.exchange_rate} {currencySettings.name}</p>
        <p>Network: {depositSettings?.chain_name}</p>
      </div>
    </div>
  );
};