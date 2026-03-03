import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Save } from 'lucide-react';
import type { Block, BlockType, CmsPage } from '@/types/cms';
import { defaultBlocks } from '@/types/cms';
import { BlockEditor } from '@/components/cms/BlockEditor';
import { BlockRenderer } from '@/components/cms/BlockRenderer';

export const PagesTab = () => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    const { data } = await supabase
      .from('cms_pages')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setPages(data as unknown as CmsPage[]);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const createPage = async () => {
    const slug = `page-${Date.now()}`;
    const { data, error } = await supabase
      .from('cms_pages')
      .insert({ title: 'New Page', slug, page_type: 'static', blocks: [] })
      .select()
      .single();
    if (error) { toast.error('Failed to create page'); return; }
    toast.success('Page created');
    setEditingPage(data as unknown as CmsPage);
    fetchPages();
  };

  const savePage = async () => {
    if (!editingPage) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('cms_pages')
      .update({
        title: editingPage.title,
        slug: editingPage.slug,
        description: editingPage.description,
        page_type: editingPage.page_type,
        blocks: editingPage.blocks as any,
        is_published: editingPage.is_published,
        meta_title: editingPage.meta_title,
        meta_description: editingPage.meta_description,
      })
      .eq('id', editingPage.id);
    setIsSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Page saved');
    fetchPages();
  };

  const deletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await supabase.from('cms_pages').delete().eq('id', id);
    toast.success('Deleted');
    fetchPages();
  };

  const addBlock = (type: BlockType) => {
    if (!editingPage) return;
    const newBlock = { id: crypto.randomUUID(), ...defaultBlocks[type]() } as Block;
    setEditingPage({ ...editingPage, blocks: [...editingPage.blocks, newBlock] });
  };

  const updateBlock = (index: number, updated: Block) => {
    if (!editingPage) return;
    const blocks = [...editingPage.blocks];
    blocks[index] = updated;
    setEditingPage({ ...editingPage, blocks });
  };

  const deleteBlock = (index: number) => {
    if (!editingPage) return;
    const blocks = editingPage.blocks.filter((_, i) => i !== index);
    setEditingPage({ ...editingPage, blocks });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (!editingPage) return;
    const blocks = [...editingPage.blocks];
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setEditingPage({ ...editingPage, blocks });
  };

  // Preview mode
  if (showPreview && editingPage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Editor
          </Button>
          <h2 className="font-bold text-lg">Preview: {editingPage.title}</h2>
        </div>
        <div className="bg-background border border-border rounded-xl p-6 space-y-6 min-h-[400px]">
          {editingPage.blocks.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No blocks added yet</p>
          ) : (
            editingPage.blocks.map(block => (
              <BlockRenderer key={block.id} block={block} />
            ))
          )}
        </div>
      </div>
    );
  }

  // Editor mode
  if (editingPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setEditingPage(null); fetchPages(); }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> All Pages
          </Button>
          <h2 className="font-bold text-lg flex-1">Editing: {editingPage.title}</h2>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={savePage} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {/* Page settings */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">Page Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={editingPage.title} onChange={e => setEditingPage({ ...editingPage, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slug</Label>
              <Input value={editingPage.slug} onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Page Type</Label>
              <Select value={editingPage.page_type} onValueChange={v => setEditingPage({ ...editingPage, page_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="feature">Feature Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input value={editingPage.description || ''} onChange={e => setEditingPage({ ...editingPage, description: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editingPage.is_published} onCheckedChange={v => setEditingPage({ ...editingPage, is_published: v })} />
            <Label className="text-sm">{editingPage.is_published ? 'Published' : 'Draft'}</Label>
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-3">
          <h3 className="font-semibold">Content Blocks</h3>
          {editingPage.blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={updated => updateBlock(i, updated)}
              onDelete={() => deleteBlock(i)}
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              isFirst={i === 0}
              isLast={i === editingPage.blocks.length - 1}
            />
          ))}
        </div>

        {/* Add block */}
        <div className="bg-card border border-dashed border-border rounded-xl p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Add Block</p>
          <div className="flex flex-wrap gap-2">
            {(['hero', 'heading', 'text', 'image', 'cta', 'columns', 'features', 'faq', 'spacer'] as BlockType[]).map(type => (
              <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)} className="capitalize">
                <Plus className="w-3 h-3 mr-1" /> {type}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Page list
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">CMS Pages</h2>
        <Button size="sm" onClick={createPage}><Plus className="w-4 h-4 mr-1" /> New Page</Button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No pages yet. Create your first page!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map(page => (
            <div key={page.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{page.title}</h3>
                <p className="text-xs text-muted-foreground">
                  /{page.slug} · {page.blocks.length} blocks · {page.is_published ? '🟢 Published' : '🟡 Draft'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingPage(page)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deletePage(page.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
