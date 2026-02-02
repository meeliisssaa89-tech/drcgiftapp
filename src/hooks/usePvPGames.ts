import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type PvPGame = Tables<'pvp_games'>;
export type PvPGameInsert = TablesInsert<'pvp_games'>;
export type PvPGameUpdate = TablesUpdate<'pvp_games'>;

export const usePvPGames = () => {
  const queryClient = useQueryClient();

  const { data: games = [], isLoading, error } = useQuery({
    queryKey: ['pvp-games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pvp_games')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PvPGame[];
    },
  });

  return { games, isLoading, error };
};

export const useAllPvPGames = () => {
  const queryClient = useQueryClient();

  const { data: games = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pvp-games-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pvp_games')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PvPGame[];
    },
  });

  const createGame = useMutation({
    mutationFn: async (game: PvPGameInsert) => {
      const { data, error } = await supabase
        .from('pvp_games')
        .insert(game)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvp-games'] });
      queryClient.invalidateQueries({ queryKey: ['pvp-games-all'] });
    },
  });

  const updateGame = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PvPGameUpdate }) => {
      const { data, error } = await supabase
        .from('pvp_games')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvp-games'] });
      queryClient.invalidateQueries({ queryKey: ['pvp-games-all'] });
    },
  });

  const deleteGame = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pvp_games')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pvp-games'] });
      queryClient.invalidateQueries({ queryKey: ['pvp-games-all'] });
    },
  });

  return { 
    games, 
    isLoading, 
    error, 
    refetch,
    createGame,
    updateGame,
    deleteGame
  };
};
