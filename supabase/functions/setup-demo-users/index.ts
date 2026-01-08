import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Task F, J, K: Complete demo users with all sectors including secondary student
const DEMO_USERS = [
  // Primary sector demo users
  { 
    email: 'demo.student@priscilla.edu', 
    password: 'Demo@Student2025', 
    role: 'student',
    name: 'Demo Primary Student',
    sector: 'primary',
    class_grade: 'Primary 3'
  },
  { 
    email: 'demo.teacher@priscilla.edu', 
    password: 'Demo@Teacher2025', 
    role: 'teacher',
    name: 'Demo Primary Teacher',
    sector: 'primary'
  },
  { 
    email: 'demo.admin@priscilla.edu', 
    password: 'Demo@Admin2025', 
    role: 'admin',
    name: 'Demo Primary Admin',
    department: 'Primary Section Administration',
    sector: 'primary'
  },
  // Secondary sector demo users
  { 
    email: 'demo.secondary.student@priscilla.edu', 
    password: 'Demo@SecStudent2025', 
    role: 'student',
    name: 'Demo Secondary Student',
    sector: 'secondary',
    class_grade: 'JSS 2'
  },
  { 
    email: 'demo.secondary.teacher@priscilla.edu', 
    password: 'Demo@SecTeacher2025', 
    role: 'teacher',
    name: 'Demo Secondary Teacher',
    sector: 'secondary'
  },
  { 
    email: 'demo.secondary.admin@priscilla.edu', 
    password: 'Demo@SecAdmin2025', 
    role: 'admin',
    name: 'Demo Secondary Admin',
    department: 'Secondary Section Administration',
    sector: 'secondary'
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
        // Update existing user's profile with sector
        await supabaseAdmin
          .from('profiles')
          .update({ 
            name: user.name,
            sector: user.sector,
            department: user.department || null,
            class_grade: user.class_grade || null
          })
          .eq('id', existingUser.id);
        
        results.push({ email: user.email, status: 'updated' });
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
          department: user.department || null,
          sector: user.sector
        }
      });

      if (createError) {
        results.push({ email: user.email, status: 'error', error: createError.message });
        continue;
      }

      // Update profile with sector and class_grade
      if (newUser.user) {
        await supabaseAdmin
          .from('profiles')
          .update({ 
            sector: user.sector,
            class_grade: user.class_grade || null
          })
          .eq('id', newUser.user.id);
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