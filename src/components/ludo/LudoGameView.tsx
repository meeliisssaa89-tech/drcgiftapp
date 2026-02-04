import { useState } from 'react';
import { ArrowLeft, Flag, MessageCircle, X, Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LudoBoard } from './LudoBoard';
import { LudoDice } from './LudoDice';
import { LudoChat } from './LudoChat';
import { CrystalIcon } from '@/components/CrystalIcon';
import type { LudoGame, ChatMessage } from '@/hooks/useLudoGame';

interface PlayerInfo {
  id: string;
  username?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  wins?: number;
}

interface LudoGameViewProps {
  game: LudoGame;
  messages: ChatMessage[];
  myId: string;
  isMyTurn: boolean;
  myColor: string | undefined;
  isRolling: boolean;
  diceValue: number | null;
  selectedToken: number | null;
  validMoves: number[];
  canRollDice: boolean;
  player1Info?: PlayerInfo | null;
  player2Info?: PlayerInfo | null;
  onBack: () => void;
  onRollDice: () => void;
  onTokenClick: (tokenIndex: number) => void;
  onSendMessage: (params: { message: string; type?: 'text' | 'emoji' }) => void;
  onForfeit?: () => void;
}

// Get rank badge based on wins
const getRankBadge = (wins: number = 0) => {
  if (wins >= 100) return { label: 'Legend', color: 'from-purple-500 to-pink-500', icon: '👑' };
  if (wins >= 50) return { label: 'Master', color: 'from-yellow-400 to-orange-500', icon: '⭐' };
  if (wins >= 20) return { label: 'Gold', color: 'from-yellow-300 to-yellow-500', icon: '🥇' };
  if (wins >= 10) return { label: 'Silver', color: 'from-gray-300 to-gray-400', icon: '🥈' };
  if (wins >= 5) return { label: 'Bronze', color: 'from-orange-300 to-orange-500', icon: '🥉' };
  return { label: 'Rookie', color: 'from-green-400 to-green-600', icon: '🌟' };
};

export const LudoGameView = ({
  game,
  messages,
  myId,
  isMyTurn,
  myColor,
  isRolling,
  diceValue,
  selectedToken,
  validMoves,
  canRollDice,
  player1Info,
  player2Info,
  onBack,
  onRollDice,
  onTokenClick,
  onSendMessage,
  onForfeit,
}: LudoGameViewProps) => {
  const [showChat, setShowChat] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  const isPlayer1 = myId === game.player1_id;
  const myInfo = isPlayer1 ? player1Info : player2Info;
  const opponentInfo = isPlayer1 ? player2Info : player1Info;
  
  const getDisplayName = (info?: PlayerInfo | null) => {
    if (!info) return 'Player';
    return info.username || info.first_name || 'Player';
  };

  const myRank = getRankBadge(myInfo?.wins);
  const opponentRank = getRankBadge(opponentInfo?.wins);

  // Game finished state
  if (game.status === 'finished') {
    const isWinner = game.winner_id === myId;
    const winnings = Math.floor(game.prize_pool * 0.95);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 animate-fade-in">
        <div className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center",
          isWinner 
            ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30"
            : "bg-gradient-to-br from-gray-400 to-gray-600"
        )}>
          {isWinner ? (
            <Crown className="w-16 h-16 text-white" />
          ) : (
            <span className="text-6xl">😢</span>
          )}
        </div>
        
        <h2 className={cn(
          "text-3xl font-bold",
          isWinner ? "text-primary" : "text-muted-foreground"
        )}>
          {isWinner ? 'Victory!' : 'Defeat'}
        </h2>
        
        {isWinner && (
          <div className="flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full border border-primary/30">
            <CrystalIcon className="w-6 h-6" />
            <span className="text-xl font-bold text-primary">+{winnings}</span>
          </div>
        )}
        
        <button
          onClick={onBack}
          className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowForfeitConfirm(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Leave</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <CrystalIcon className="w-4 h-4" />
          <span className="font-bold text-primary">{game.prize_pool}</span>
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          className="relative p-2 rounded-lg bg-card/60 hover:bg-card transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Players Info Bar */}
      <div className="flex items-center justify-between p-3 bg-card/60 rounded-xl border border-border/50">
        {/* My Info */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            myColor === 'blue' ? "from-blue-500 to-blue-700" : "from-red-500 to-red-700"
          )}>
            {myInfo?.avatar_url ? (
              <img src={myInfo.avatar_url} alt="You" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
            {isMyTurn && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{getDisplayName(myInfo)}</p>
            <div className={cn("text-xs px-2 py-0.5 rounded-full bg-gradient-to-r text-white", myRank.color)}>
              {myRank.icon} {myRank.label}
            </div>
          </div>
        </div>

        {/* VS */}
        <div className="text-xl font-black text-muted-foreground">VS</div>

        {/* Opponent Info */}
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center",
            "bg-gradient-to-br shadow-lg",
            myColor === 'blue' ? "from-red-500 to-red-700" : "from-blue-500 to-blue-700"
          )}>
            {opponentInfo?.avatar_url ? (
              <img src={opponentInfo.avatar_url} alt="Opponent" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
            {!isMyTurn && game.status === 'playing' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm text-foreground">{getDisplayName(opponentInfo)}</p>
            <div className={cn("text-xs px-2 py-0.5 rounded-full bg-gradient-to-r text-white", opponentRank.color)}>
              {opponentRank.icon} {opponentRank.label}
            </div>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className={cn(
        "text-center py-2 px-4 rounded-lg font-medium transition-all",
        isMyTurn 
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-muted/50 text-muted-foreground"
      )}>
        {isMyTurn ? "🎯 Your Turn!" : "⏳ Opponent's Turn"}
      </div>

      {/* Game Board */}
      <LudoBoard
        player1Tokens={game.game_state.player1_tokens}
        player2Tokens={game.game_state.player2_tokens}
        player1Color={game.game_state.player1_color}
        player2Color={game.game_state.player2_color}
        validMoves={isMyTurn ? validMoves : []}
        selectedToken={selectedToken}
        isMyTurn={isMyTurn}
        myColor={myColor}
        onTokenClick={onTokenClick}
      />

      {/* Dice Section */}
      <div className="mt-4">
        <LudoDice
          value={diceValue}
          isRolling={isRolling}
          canRoll={canRollDice}
          onRoll={onRollDice}
        />
      </div>

      {/* Valid moves hint */}
      {validMoves.length > 0 && diceValue !== null && (
        <p className="text-center text-sm text-muted-foreground">
          Tap a highlighted token to move
        </p>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-lg">Game Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <LudoChat
              messages={messages}
              myId={myId}
              onSendMessage={onSendMessage}
            />
          </div>
        </div>
      )}

      {/* Forfeit Confirmation */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-2xl border border-border max-w-sm w-full space-y-4">
            <div className="text-center">
              <Flag className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="text-xl font-bold">Forfeit Game?</h3>
              <p className="text-muted-foreground mt-2">
                You will lose the match and your opponent will win the prize pool.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowForfeitConfirm(false);
                  onForfeit?.();
                  onBack();
                }}
                className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
              >
                Forfeit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
