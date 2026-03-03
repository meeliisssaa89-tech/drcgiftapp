import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlockRenderer } from '@/components/cms/BlockRenderer';
import { ArrowLeft } from 'lucide-react';
import type { CmsPage as CmsPageType } from '@/types/cms';

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: page, isLoading } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      return data as unknown as CmsPageType;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-muted-foreground">This page doesn't exist or isn't published yet.</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {page.meta_title && <title>{page.meta_title}</title>}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {page.blocks.map(block => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </main>
    </div>
  );
};

export default CmsPage;
