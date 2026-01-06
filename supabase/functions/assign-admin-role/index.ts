import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin emails that should automatically get admin role
const ADMIN_EMAILS = [
  'admin@crystalspin.app',
  'admin@example.com',
  // Add more admin emails here
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { record } = await req.json();

    if (!record || !record.id || !record.email) {
      console.log('Invalid webhook payload:', record);
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = record.email.toLowerCase();
    const userId = record.id;

    console.log(`Processing signup for user: ${userEmail} (${userId})`);

    // Check if user email is in admin list
    if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
      console.log(`Admin email detected: ${userEmail}, assigning admin role...`);

      // Insert admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin',
        });

      if (roleError) {
        // Ignore duplicate key errors (user might already have role)
        if (roleError.code !== '23505') {
          console.error('Error assigning admin role:', roleError);
          return new Response(
            JSON.stringify({ error: 'Failed to assign role', details: roleError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Admin role already exists for user');
      } else {
        console.log(`Successfully assigned admin role to ${userEmail}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Admin role assigned' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Regular user signup: ${userEmail}, no admin role assigned`);
    return new Response(
      JSON.stringify({ success: true, message: 'No admin role needed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
