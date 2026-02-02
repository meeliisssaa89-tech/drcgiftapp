import { useState } from 'react';
import { Plus, Pencil, Trash2, Gamepad2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAllPvPGames, PvPGameInsert, PvPGameUpdate } from '@/hooks/usePvPGames';
import { useToast } from '@/hooks/use-toast';

export const PvPGamesTab = () => {
  const { games, isLoading, createGame, updateGame, deleteGame } = useAllPvPGames();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PvPGameInsert>>({
    name: '',
    subtitle: 'Play & Win Crystals',
    description: '',
    icon_emoji: '🎮',
    image_url: '',
    game_url: '',
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subtitle: 'Play & Win Crystals',
      description: '',
      icon_emoji: '🎮',
      image_url: '',
      game_url: '',
      is_active: true,
      sort_order: games.length,
    });
    setEditingGame(null);
  };

  const handleOpenDialog = (gameId?: string) => {
    if (gameId) {
      const game = games.find(g => g.id === gameId);
      if (game) {
        setFormData({
          name: game.name,
          subtitle: game.subtitle,
          description: game.description || '',
          icon_emoji: game.icon_emoji,
          image_url: game.image_url || '',
          game_url: game.game_url || '',
          is_active: game.is_active,
          sort_order: game.sort_order,
        });
        setEditingGame(gameId);
      }
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Game name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGame) {
        await updateGame.mutateAsync({
          id: editingGame,
          updates: formData as PvPGameUpdate,
        });
        toast({
          title: 'Success',
          description: 'Game updated successfully',
        });
      } else {
        await createGame.mutateAsync(formData as PvPGameInsert);
        toast({
          title: 'Success',
          description: 'Game created successfully',
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save game',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await deleteGame.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Game deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete game',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateGame.mutateAsync({
        id,
        updates: { is_active: isActive },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update game status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">PvP Games</h2>
          <p className="text-sm text-muted-foreground">Manage multiplayer games</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGame ? 'Edit Game' : 'Add New Game'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Game Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ludo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g., Play & Win Crystals"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon_emoji">Icon Emoji</Label>
                <Input
                  id="icon_emoji"
                  value={formData.icon_emoji}
                  onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
                  placeholder="🎮"
                  className="text-2xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="game_url">Game URL</Label>
                <Input
                  id="game_url"
                  value={formData.game_url}
                  onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                  placeholder="/games/ludo or https://..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createGame.isPending || updateGame.isPending}>
                  {editingGame ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Games List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : games.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No games added yet</p>
            </CardContent>
          </Card>
        ) : (
          games.map((game) => (
            <Card key={game.id} className={!game.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{game.icon_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{game.name}</h3>
                      {!game.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Disabled</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{game.subtitle}</p>
                    {game.game_url && (
                      <p className="text-xs text-muted-foreground/60 truncate">{game.game_url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={game.is_active}
                      onCheckedChange={(checked) => handleToggleActive(game.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(game.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(game.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
