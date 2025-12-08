import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USERS = [
  { 
    email: 'demo.student@priscilla.edu', 
    password: 'Demo@Student2025', 
    role: 'student',
    name: 'Demo Student'
  },
  { 
    email: 'demo.teacher@priscilla.edu', 
    password: 'Demo@Teacher2025', 
    role: 'teacher',
    name: 'Demo Teacher'
  },
  { 
    email: 'demo.admin@priscilla.edu', 
    password: 'Demo@Admin2025', 
    role: 'admin',
    name: 'Demo Admin',
    department: 'Information Technology Department'
  },
];

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

    const results = [];

    for (const user of DEMO_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      
      if (existingUser) {
        results.push({ email: user.email, status: 'already_exists' });
        continue;
      }

      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          department: user.department || null
        }
      });

      if (createError) {
        results.push({ email: user.email, status: 'error', error: createError.message });
        continue;
      }

      results.push({ email: user.email, status: 'created', userId: newUser.user?.id });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});