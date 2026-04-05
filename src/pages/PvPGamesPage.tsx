import { Gamepad2, Clock, Sparkles } from 'lucide-react';

export const PvPGamesPage = () => {
  return (
    <div className="space-y-8 animate-fade-in min-h-[60vh] flex flex-col items-center justify-center">
      {/* Coming Soon Hero */}
      <div className="text-center space-y-4 px-6">
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4">
          <Gamepad2 className="w-12 h-12 text-primary" />
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <Clock className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground">PvP Games</h1>
        
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Coming Soon</span>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>

        <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
          نعمل على تجهيز ألعاب PvP مثيرة! سيتم إطلاقها قريباً مع مكافآت حقيقية.
        </p>
      </div>

      {/* Preview Cards */}
      <div className="w-full px-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🎲', name: 'Ludo', desc: 'Board Game' },
            { emoji: '♟️', name: 'Chess', desc: 'Strategy' },
            { emoji: '🃏', name: 'Cards', desc: 'Card Game' },
            { emoji: '🎯', name: 'Darts', desc: 'Aim & Win' },
          ].map((game, i) => (
            <div
              key={game.name}
              className="bg-card/50 border border-border/30 rounded-2xl p-4 text-center opacity-50 relative overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
              <div className="relative z-10">
                <span className="text-3xl block mb-2">{game.emoji}</span>
                <p className="font-semibold text-sm text-foreground">{game.name}</p>
                <p className="text-xs text-muted-foreground">{game.desc}</p>
              </div>
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[10px] bg-muted/80 px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
                  SOON
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
