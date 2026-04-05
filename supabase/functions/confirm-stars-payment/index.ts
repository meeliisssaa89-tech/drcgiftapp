import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ConfirmPaymentSchema = z.object({
  profile_id: z.string().uuid(),
  stars_amount: z.number().int().min(1),
  telegram_payment_id: z.string().min(1),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const parsed = ConfirmPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile_id, stars_amount, telegram_payment_id } = parsed.data;

    // Get exchange rate from settings
    const { data: settingsData } = await supabase
      .from('game_settings')
      .select('value')
      .eq('key', 'telegram_stars')
      .single();

    const exchangeRate = (settingsData?.value as any)?.exchange_rate || 10;
    const crystalsToCredit = Math.floor(stars_amount * exchangeRate);

    // Check for duplicate payment
    const { data: existing } = await supabase
      .from('telegram_star_deposits')
      .select('id')
      .eq('telegram_payment_id', telegram_payment_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Payment already processed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record deposit
    const { error: insertError } = await supabase
      .from('telegram_star_deposits')
      .insert({
        profile_id,
        telegram_payment_id,
        stars_amount,
        crystals_credited: crystalsToCredit,
        status: 'completed',
        confirmed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to record deposit' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Credit crystals to user
    const { data: profile } = await supabase
      .from('profiles')
      .select('crystals')
      .eq('id', profile_id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ crystals: (profile.crystals || 0) + crystalsToCredit })
        .eq('id', profile_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      crystals_credited: crystalsToCredit,
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
