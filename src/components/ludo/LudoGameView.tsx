import { ArrowLeft, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LudoBoard } from './LudoBoard';
import { LudoDice } from './LudoDice';
import { LudoChat } from './LudoChat';
import { CrystalIcon } from '@/components/CrystalIcon';
import type { LudoGame, ChatMessage } from '@/hooks/useLudoGame';

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
  player1Name?: string;
  player2Name?: string;
  onBack: () => void;
  onRollDice: () => void;
  onTokenClick: (index: number) => void;
  onSendMessage: (params: { message: string; type?: 'text' | 'emoji' }) => void;
}

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
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  onBack,
  onRollDice,
  onTokenClick,
  onSendMessage,
}: LudoGameViewProps) => {
  const isFinished = game.status === 'finished';
  const amIWinner = game.winner_id === myId;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Leave</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 rounded-full border border-border/50">
          <CrystalIcon className="w-4 h-4" />
          <span className="font-semibold text-sm">{game.prize_pool}</span>
        </div>
      </div>

      {/* Players */}
      <div className="flex items-center justify-between px-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
          game.current_turn === game.player1_id && "bg-blue-500/20 ring-2 ring-blue-500"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
            P1
          </div>
          <div>
            <p className="text-sm font-medium">{player1Name}</p>
            <div className="flex gap-1">
              {game.game_state.player1_tokens.map((pos, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    pos === 62 ? "bg-green-500" : pos >= 0 ? "bg-blue-500" : "bg-gray-500"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="text-muted-foreground font-bold">VS</span>

        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
          game.current_turn === game.player2_id && "bg-red-500/20 ring-2 ring-red-500"
        )}>
          <div>
            <p className="text-sm font-medium text-right">{player2Name}</p>
            <div className="flex gap-1 justify-end">
              {game.game_state.player2_tokens.map((pos, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    pos === 62 ? "bg-green-500" : pos >= 0 ? "bg-red-500" : "bg-gray-500"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-bold">
            P2
          </div>
        </div>
      </div>

      {/* Game Finished Overlay */}
      {isFinished && (
        <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center animate-scale-in">
          <Crown className={cn(
            "w-16 h-16 mx-auto mb-3",
            amIWinner ? "text-yellow-500" : "text-muted-foreground"
          )} />
          <h3 className="text-2xl font-bold mb-2">
            {amIWinner ? '🎉 You Won!' : 'Game Over'}
          </h3>
          <p className="text-muted-foreground">
            {amIWinner
              ? `You won ${Math.floor(game.prize_pool * 0.95)} crystals!`
              : 'Better luck next time!'}
          </p>
        </div>
      )}

      {/* Board */}
      {!isFinished && (
        <>
          <LudoBoard
            player1Tokens={game.game_state.player1_tokens}
            player2Tokens={game.game_state.player2_tokens}
            player1Color={game.game_state.player1_color}
            player2Color={game.game_state.player2_color}
            validMoves={game.player1_id === myId ? validMoves : []}
            selectedToken={selectedToken}
            isMyTurn={isMyTurn}
            myColor={myColor}
            onTokenClick={onTokenClick}
          />

          {/* Dice */}
          <LudoDice
            value={diceValue}
            isRolling={isRolling}
            isMyTurn={isMyTurn}
            canRoll={isMyTurn && !isRolling && validMoves.length === 0 && diceValue === null}
            onRoll={onRollDice}
          />
        </>
      )}

      {/* Chat */}
      <LudoChat
        messages={messages}
        myId={myId}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};
