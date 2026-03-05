import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Gamepad2, Upload, ExternalLink, Code, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllPvPGames, PvPGameInsert, PvPGameUpdate } from '@/hooks/usePvPGames';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const PvPGamesTab = () => {
  const { games, isLoading, createGame, updateGame, deleteGame } = useAllPvPGames();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<PvPGameInsert> & { game_type?: string; game_files_path?: string }>({
    name: '',
    subtitle: 'Play & Win Crystals',
    description: '',
    icon_emoji: '🎮',
    image_url: '',
    game_url: '',
    is_active: true,
    sort_order: 0,
    game_type: 'internal',
    game_files_path: '',
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
      game_type: 'internal',
      game_files_path: '',
    });
    setEditingGame(null);
    setUploadedFiles([]);
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
          game_type: (game as any).game_type || 'internal',
          game_files_path: (game as any).game_files_path || '',
        });
        setEditingGame(gameId);
      }
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    
    const gameFolderName = `game-${Date.now()}`;
    const uploaded: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Preserve relative path from webkitdirectory or use filename
        const relativePath = (file as any).webkitRelativePath || file.name;
        // Remove the top-level folder name if present from webkitRelativePath
        const parts = relativePath.split('/');
        const cleanPath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
        
        const filePath = `${gameFolderName}/${cleanPath}`;
        
        const { error } = await supabase.storage
          .from('game-files')
          .upload(filePath, file, { upsert: true });

        if (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        } else {
          uploaded.push(cleanPath);
        }
      }
      
      setUploadedFiles(uploaded);
      setFormData(prev => ({ ...prev, game_files_path: gameFolderName }));
      
      toast({
        title: 'Upload Complete',
        description: `${uploaded.length} files uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload game files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({ title: 'Error', description: 'Game name is required', variant: 'destructive' });
      return;
    }

    // For hosted games, set game_url to the hosted page route
    let finalGameUrl = formData.game_url;
    if (formData.game_type === 'hosted' && formData.game_files_path) {
      // Will be set after creation with the game ID
      finalGameUrl = ''; // placeholder
    }

    try {
      const submitData: any = {
        name: formData.name,
        subtitle: formData.subtitle,
        description: formData.description,
        icon_emoji: formData.icon_emoji,
        image_url: formData.image_url,
        game_url: finalGameUrl,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
        game_type: formData.game_type,
        game_files_path: formData.game_files_path,
      };

      if (editingGame) {
        await updateGame.mutateAsync({ id: editingGame, updates: submitData });
        // Set game_url to hosted route if hosted type
        if (formData.game_type === 'hosted') {
          await updateGame.mutateAsync({
            id: editingGame,
            updates: { game_url: `/games/hosted/${editingGame}` },
          });
        }
        toast({ title: 'Success', description: 'Game updated successfully' });
      } else {
        const result = await createGame.mutateAsync(submitData);
        // Update game_url for hosted games
        if (formData.game_type === 'hosted' && result?.id) {
          await updateGame.mutateAsync({
            id: result.id,
            updates: { game_url: `/games/hosted/${result.id}` },
          });
        }
        toast({ title: 'Success', description: 'Game created successfully' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save game', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    try {
      await deleteGame.mutateAsync(id);
      toast({ title: 'Success', description: 'Game deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete game', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateGame.mutateAsync({ id, updates: { is_active: isActive } });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update game status', variant: 'destructive' });
    }
  };

  const getGameTypeIcon = (type: string) => {
    switch (type) {
      case 'hosted': return <FileCode className="w-4 h-4 text-green-400" />;
      case 'external': return <ExternalLink className="w-4 h-4 text-blue-400" />;
      default: return <Code className="w-4 h-4 text-primary" />;
    }
  };

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'hosted': return 'Hosted';
      case 'external': return 'External API';
      default: return 'Built-in';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">PvP Games</h2>
          <p className="text-sm text-muted-foreground">Manage games — upload files, link APIs, or use built-in</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Game Type */}
              <div className="space-y-2">
                <Label>Game Type</Label>
                <Select
                  value={formData.game_type}
                  onValueChange={(v) => setFormData({ ...formData, game_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Built-in (React component)
                      </div>
                    </SelectItem>
                    <SelectItem value="hosted">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4" />
                        Hosted (Upload game files)
                      </div>
                    </SelectItem>
                    <SelectItem value="external">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        External (API / URL)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Game Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chess"
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
                <Label htmlFor="image_url">Cover Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Hosted: File upload */}
              {formData.game_type === 'hosted' && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Game Files
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a folder with HTML, JS, CSS files. Must include an index.html as entry point.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Select Game Folder
                      </div>
                    )}
                  </Button>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-green-400">
                        ✅ {uploadedFiles.length} files uploaded
                      </p>
                      <div className="max-h-24 overflow-y-auto text-xs text-muted-foreground space-y-0.5">
                        {uploadedFiles.slice(0, 10).map((f, i) => (
                          <div key={i} className="truncate">📄 {f}</div>
                        ))}
                        {uploadedFiles.length > 10 && (
                          <div>...and {uploadedFiles.length - 10} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  {formData.game_files_path && (
                    <p className="text-xs text-muted-foreground">
                      Path: {formData.game_files_path}
                    </p>
                  )}
                </div>
              )}

              {/* External: URL/API input */}
              {(formData.game_type === 'external' || formData.game_type === 'internal') && (
                <div className="space-y-2">
                  <Label htmlFor="game_url">
                    {formData.game_type === 'external' ? 'External Game URL / API' : 'Internal Route'}
                  </Label>
                  <Input
                    id="game_url"
                    value={formData.game_url}
                    onChange={(e) => setFormData({ ...formData, game_url: e.target.value })}
                    placeholder={formData.game_type === 'external' ? 'https://game-api.com/play' : '/games/ludo'}
                  />
                </div>
              )}
              
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
                      {getGameTypeIcon((game as any).game_type || 'internal')}
                      <span className="text-xs text-muted-foreground">
                        {getGameTypeLabel((game as any).game_type || 'internal')}
                      </span>
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(game.id)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(game.id)}>
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
