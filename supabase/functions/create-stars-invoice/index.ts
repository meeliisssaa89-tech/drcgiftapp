import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CreateInvoiceSchema = z.object({
  stars_amount: z.number().int().min(1).max(10000),
  profile_id: z.string().uuid(),
  title: z.string().optional().default('Crystal Top Up'),
  description: z.string().optional().default('Purchase crystals with Telegram Stars'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'Bot token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { stars_amount, profile_id, title, description } = parsed.data;

    // Create invoice link via Telegram Bot API
    const invoiceResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload: JSON.stringify({ profile_id, stars_amount, ts: Date.now() }),
        currency: 'XTR', // Telegram Stars currency
        prices: [{ label: `${stars_amount} Stars`, amount: stars_amount }],
      }),
    });

    const invoiceData = await invoiceResponse.json();

    if (!invoiceData.ok) {
      console.error('Telegram API error:', invoiceData);
      return new Response(JSON.stringify({ error: 'Failed to create invoice', details: invoiceData.description }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      invoice_url: invoiceData.result,
      stars_amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
