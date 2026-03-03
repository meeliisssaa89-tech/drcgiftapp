import { useState } from 'react';
import type { Block, BlockType } from '@/types/cms';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface BlockEditorProps {
  block: Block;
  onChange: (updated: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const BlockEditor = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: BlockEditorProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const update = (partial: Partial<Block>) => {
    onChange({ ...block, ...partial } as Block);
  };

  const blockLabels: Record<BlockType, string> = {
    hero: '🦸 Hero',
    text: '📝 Text',
    heading: '🔤 Heading',
    image: '🖼️ Image',
    cta: '🔘 Call to Action',
    spacer: '↕️ Spacer',
    columns: '📊 Columns',
    features: '⭐ Features',
    faq: '❓ FAQ',
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        <span className="font-medium text-sm flex-1">{blockLabels[block.type]}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={isFirst} className="h-7 w-7 p-0">↑</Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={isLast} className="h-7 w-7 p-0">↓</Button>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-7 px-2 text-xs">
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {block.type === 'hero' && (
            <>
              <Field label="Title"><Input value={block.title} onChange={e => update({ title: e.target.value })} /></Field>
              <Field label="Subtitle"><Input value={block.subtitle} onChange={e => update({ subtitle: e.target.value })} /></Field>
              <Field label="Button Text"><Input value={block.buttonText} onChange={e => update({ buttonText: e.target.value })} /></Field>
              <Field label="Button URL"><Input value={block.buttonUrl} onChange={e => update({ buttonUrl: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Background Color"><Input value={block.bgColor} onChange={e => update({ bgColor: e.target.value })} /></Field>
                <Field label="Text Color"><Input value={block.textColor} onChange={e => update({ textColor: e.target.value })} /></Field>
              </div>
            </>
          )}

          {block.type === 'text' && (
            <>
              <Field label="Content"><Textarea rows={4} value={block.content} onChange={e => update({ content: e.target.value })} /></Field>
              <AlignSelect value={block.align} onChange={v => update({ align: v as any })} />
            </>
          )}

          {block.type === 'heading' && (
            <>
              <Field label="Text"><Input value={block.text} onChange={e => update({ text: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Level">
                  <Select value={String(block.level)} onValueChange={v => update({ level: Number(v) as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">H1</SelectItem>
                      <SelectItem value="2">H2</SelectItem>
                      <SelectItem value="3">H3</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <AlignSelect value={block.align} onChange={v => update({ align: v as any })} />
              </div>
            </>
          )}

          {block.type === 'image' && (
            <>
              <Field label="Image URL"><Input value={block.src} onChange={e => update({ src: e.target.value })} /></Field>
              <Field label="Alt Text"><Input value={block.alt} onChange={e => update({ alt: e.target.value })} /></Field>
              <Field label="Caption"><Input value={block.caption} onChange={e => update({ caption: e.target.value })} /></Field>
            </>
          )}

          {block.type === 'cta' && (
            <>
              <Field label="Title"><Input value={block.title} onChange={e => update({ title: e.target.value })} /></Field>
              <Field label="Description"><Input value={block.description} onChange={e => update({ description: e.target.value })} /></Field>
              <Field label="Button Text"><Input value={block.buttonText} onChange={e => update({ buttonText: e.target.value })} /></Field>
              <Field label="Button URL"><Input value={block.buttonUrl} onChange={e => update({ buttonUrl: e.target.value })} /></Field>
              <Field label="Variant">
                <Select value={block.variant} onValueChange={v => update({ variant: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {block.type === 'spacer' && (
            <Field label="Height (px)">
              <Input type="number" value={block.height} onChange={e => update({ height: Number(e.target.value) })} />
            </Field>
          )}

          {block.type === 'columns' && (
            <div className="space-y-4">
              {block.columns.map((col, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Column {i + 1}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => {
                      const cols = [...block.columns];
                      cols.splice(i, 1);
                      update({ columns: cols });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Icon emoji" value={col.icon} onChange={e => {
                    const cols = [...block.columns];
                    cols[i] = { ...cols[i], icon: e.target.value };
                    update({ columns: cols });
                  }} />
                  <Input placeholder="Title" value={col.title} onChange={e => {
                    const cols = [...block.columns];
                    cols[i] = { ...cols[i], title: e.target.value };
                    update({ columns: cols });
                  }} />
                  <Input placeholder="Content" value={col.content} onChange={e => {
                    const cols = [...block.columns];
                    cols[i] = { ...cols[i], content: e.target.value };
                    update({ columns: cols });
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update({ columns: [...block.columns, { title: 'New', content: 'Content', icon: '📌' }] })}>
                <Plus className="w-4 h-4 mr-1" /> Add Column
              </Button>
            </div>
          )}

          {block.type === 'features' && (
            <div className="space-y-4">
              <Field label="Section Title"><Input value={block.title} onChange={e => update({ title: e.target.value })} /></Field>
              {block.items.map((item, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Feature {i + 1}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => {
                      const items = [...block.items];
                      items.splice(i, 1);
                      update({ items });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Icon" value={item.icon} onChange={e => {
                    const items = [...block.items];
                    items[i] = { ...items[i], icon: e.target.value };
                    update({ items });
                  }} />
                  <Input placeholder="Title" value={item.title} onChange={e => {
                    const items = [...block.items];
                    items[i] = { ...items[i], title: e.target.value };
                    update({ items });
                  }} />
                  <Input placeholder="Description" value={item.description} onChange={e => {
                    const items = [...block.items];
                    items[i] = { ...items[i], description: e.target.value };
                    update({ items });
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update({ items: [...block.items, { icon: '✨', title: 'New Feature', description: 'Description' }] })}>
                <Plus className="w-4 h-4 mr-1" /> Add Feature
              </Button>
            </div>
          )}

          {block.type === 'faq' && (
            <div className="space-y-4">
              <Field label="Section Title"><Input value={block.title} onChange={e => update({ title: e.target.value })} /></Field>
              {block.items.map((item, i) => (
                <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => {
                      const items = [...block.items];
                      items.splice(i, 1);
                      update({ items });
                    }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                  <Input placeholder="Question" value={item.question} onChange={e => {
                    const items = [...block.items];
                    items[i] = { ...items[i], question: e.target.value };
                    update({ items });
                  }} />
                  <Textarea placeholder="Answer" rows={2} value={item.answer} onChange={e => {
                    const items = [...block.items];
                    items[i] = { ...items[i], answer: e.target.value };
                    update({ items });
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => update({ items: [...block.items, { question: 'New Question?', answer: 'Answer here.' }] })}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const AlignSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Field label="Alignment">
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Left</SelectItem>
        <SelectItem value="center">Center</SelectItem>
        <SelectItem value="right">Right</SelectItem>
      </SelectContent>
    </Select>
  </Field>
);
