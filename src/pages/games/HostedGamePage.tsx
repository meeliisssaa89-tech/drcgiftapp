import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const HostedGamePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: game, isLoading } = useQuery({
    queryKey: ['pvp-game', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('pvp_games')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const gameUrl = (() => {
    if (!game) return null;
    
    // If game has external URL, use it directly
    if (game.game_url?.startsWith('http')) {
      return game.game_url;
    }
    
    // If game has files in storage, construct the URL
    if ((game as any).game_files_path) {
      const { data } = supabase.storage
        .from('game-files')
        .getPublicUrl(`${(game as any).game_files_path}/index.html`);
      return data.publicUrl;
    }
    
    return null;
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game || !gameUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Game not found</p>
        <button
          onClick={() => navigate('/pvp-games')}
          className="flex items-center gap-2 text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <button
          onClick={() => navigate('/pvp-games')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.icon_emoji}</span>
          <h1 className="font-semibold text-foreground">{game.name}</h1>
        </div>
      </div>

      {/* Game iframe */}
      <div className="flex-1 relative">
        <iframe
          src={gameUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={game.name}
        />
      </div>
    </div>
  );
};
