import type { Block } from '@/types/cms';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface BlockRendererProps {
  block: Block;
}

export const BlockRenderer = ({ block }: BlockRendererProps) => {
  switch (block.type) {
    case 'hero':
      return (
        <section
          className="rounded-xl p-8 md:p-16 text-center"
          style={{ backgroundColor: block.bgColor, color: block.textColor }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{block.title}</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">{block.subtitle}</p>
          {block.buttonText && (
            <a href={block.buttonUrl} className="inline-block">
              <Button size="lg" variant="secondary">{block.buttonText}</Button>
            </a>
          )}
        </section>
      );

    case 'text':
      return (
        <div className={`prose prose-invert max-w-none text-${block.align}`}>
          <p className="text-foreground/80 whitespace-pre-wrap">{block.content}</p>
        </div>
      );

    case 'heading': {
      const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
      const sizes = { 1: 'text-3xl md:text-4xl', 2: 'text-2xl md:text-3xl', 3: 'text-xl md:text-2xl' };
      return (
        <Tag className={`font-bold text-foreground ${sizes[block.level]} text-${block.align}`}>
          {block.text}
        </Tag>
      );
    }

    case 'image':
      return (
        <figure className="space-y-2">
          <img
            src={block.src}
            alt={block.alt}
            className={`w-full max-h-[400px] object-cover ${block.rounded ? 'rounded-xl' : ''}`}
          />
          {block.caption && (
            <figcaption className="text-sm text-muted-foreground text-center">{block.caption}</figcaption>
          )}
        </figure>
      );

    case 'cta':
      return (
        <section className="bg-card border border-border rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-2">{block.title}</h3>
          <p className="text-muted-foreground mb-6">{block.description}</p>
          <a href={block.buttonUrl}>
            <Button variant={block.variant === 'primary' ? 'default' : block.variant === 'secondary' ? 'secondary' : 'outline'}>
              {block.buttonText}
            </Button>
          </a>
        </section>
      );

    case 'spacer':
      return <div style={{ height: block.height }} />;

    case 'columns':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.columns.map((col, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 text-center">
              <span className="text-3xl mb-3 block">{col.icon}</span>
              <h4 className="font-semibold text-foreground mb-2">{col.title}</h4>
              <p className="text-sm text-muted-foreground">{col.content}</p>
            </div>
          ))}
        </div>
      );

    case 'features':
      return (
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-foreground text-center">{block.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {block.items.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="space-y-4 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center">{block.title}</h3>
          <Accordion type="single" collapsible>
            {block.items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      );

    default:
      return <div className="p-4 bg-destructive/10 rounded text-destructive">Unknown block type</div>;
  }
};
