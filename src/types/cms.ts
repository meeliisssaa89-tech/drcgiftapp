export type BlockType = 
  | 'hero'
  | 'text'
  | 'heading'
  | 'image'
  | 'cta'
  | 'spacer'
  | 'columns'
  | 'features'
  | 'faq';

export interface BlockBase {
  id: string;
  type: BlockType;
}

export interface HeroBlock extends BlockBase {
  type: 'hero';
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  bgColor: string;
  textColor: string;
}

export interface TextBlock extends BlockBase {
  type: 'text';
  content: string;
  align: 'left' | 'center' | 'right';
}

export interface HeadingBlock extends BlockBase {
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: 'left' | 'center' | 'right';
}

export interface ImageBlock extends BlockBase {
  type: 'image';
  src: string;
  alt: string;
  caption: string;
  rounded: boolean;
}

export interface CtaBlock extends BlockBase {
  type: 'cta';
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  variant: 'primary' | 'secondary' | 'outline';
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  height: number;
}

export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  columns: { title: string; content: string; icon: string }[];
}

export interface FeaturesBlock extends BlockBase {
  type: 'features';
  title: string;
  items: { icon: string; title: string; description: string }[];
}

export interface FaqBlock extends BlockBase {
  type: 'faq';
  title: string;
  items: { question: string; answer: string }[];
}

export type Block =
  | HeroBlock
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | CtaBlock
  | SpacerBlock
  | ColumnsBlock
  | FeaturesBlock
  | FaqBlock;

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  page_type: string;
  blocks: Block[];
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export const defaultBlocks: Record<BlockType, () => Omit<Block, 'id'>> = {
  hero: () => ({
    type: 'hero',
    title: 'Welcome',
    subtitle: 'Add a subtitle here',
    buttonText: 'Get Started',
    buttonUrl: '#',
    bgColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--primary-foreground))',
  }),
  text: () => ({
    type: 'text',
    content: 'Enter your text here...',
    align: 'left',
  }),
  heading: () => ({
    type: 'heading',
    text: 'Section Heading',
    level: 2,
    align: 'left',
  }),
  image: () => ({
    type: 'image',
    src: '/placeholder.svg',
    alt: 'Image',
    caption: '',
    rounded: true,
  }),
  cta: () => ({
    type: 'cta',
    title: 'Ready to get started?',
    description: 'Join thousands of users today.',
    buttonText: 'Sign Up',
    buttonUrl: '#',
    variant: 'primary',
  }),
  spacer: () => ({
    type: 'spacer',
    height: 48,
  }),
  columns: () => ({
    type: 'columns',
    columns: [
      { title: 'Column 1', content: 'Content here', icon: '📌' },
      { title: 'Column 2', content: 'Content here', icon: '🎯' },
      { title: 'Column 3', content: 'Content here', icon: '🚀' },
    ],
  }),
  features: () => ({
    type: 'features',
    title: 'Features',
    items: [
      { icon: '⚡', title: 'Fast', description: 'Lightning fast performance' },
      { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
      { icon: '🎨', title: 'Beautiful', description: 'Modern, clean design' },
    ],
  }),
  faq: () => ({
    type: 'faq',
    title: 'FAQ',
    items: [
      { question: 'How does it work?', answer: 'Simply sign up and get started.' },
      { question: 'Is it free?', answer: 'We offer a free tier to get started.' },
    ],
  }),
};
