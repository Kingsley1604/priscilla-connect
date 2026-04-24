import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The designated super admin email is loaded from environment configuration
// (set via Supabase Edge Function secrets) so it isn't hardcoded in source.
// Falls back to the historical value to preserve backward compatibility.
const SUPER_ADMIN_EMAIL =
  Deno.env.get("SUPER_ADMIN_EMAIL") ?? "abelkingsley2k04@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header to identify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this user is the designated super admin
    if (user.email !== SUPER_ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: "This account is not authorized to become super admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already a super admin
    const { data: existingSuperAdmin } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('is_super_admin', true)
      .single();

    if (existingSuperAdmin && existingSuperAdmin.id !== user.id) {
      return new Response(
        JSON.stringify({ error: "A super admin already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set this user as super admin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_super_admin: true })
      .eq('id', user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure user has admin role
    await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Super admin status activated",
        userId: user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
