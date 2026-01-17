import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: 'signup' | 'login' | 'order' | 'content_alert' | 'deactivation' | 'maintenance' | 'result_upload';
  recipientType: 'super_admin' | 'admin' | 'all_admins' | 'primary_admins' | 'secondary_admins';
  subject: string;
  message: string;
  details?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email notifications disabled");
      return new Response(
        JSON.stringify({ success: false, message: "Email notifications not configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Initialize Supabase client to fetch admin emails
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipientType, subject, message, details }: EmailNotificationRequest = await req.json();

    console.log(`[send-email-notification] Processing ${type} notification for ${recipientType}`);

    // Fetch admin emails from database based on recipient type
    let adminEmails: string[] = [];
    
    if (recipientType === 'super_admin') {
      // Get super admin emails from profiles
      const { data: superAdmins, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_super_admin', true);
      
      console.log(`[send-email-notification] Found ${superAdmins?.length || 0} super admins in profiles`);
      
      if (profileError) {
        console.error('[send-email-notification] Error fetching super admin profiles:', profileError);
      }
      
      if (superAdmins && superAdmins.length > 0) {
        // Get emails from auth.users using admin API
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('[send-email-notification] Error listing auth users:', authError);
        }
        
        if (authData?.users) {
          const superAdminIds = superAdmins.map(sa => sa.id);
          adminEmails = authData.users
            .filter(u => superAdminIds.includes(u.id) && u.email)
            .map(u => u.email!);
          console.log(`[send-email-notification] Super admin emails found:`, adminEmails.length);
        }
      }
    } else if (recipientType === 'primary_admins') {
      // Get primary sector admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles && adminRoles.length > 0) {
        // Get profiles with primary sector
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', adminRoles.map(ar => ar.user_id))
          .eq('sector', 'primary');
        
        if (profiles && profiles.length > 0) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          if (authData?.users) {
            const adminIds = profiles.map(p => p.id);
            adminEmails = authData.users
              .filter(u => adminIds.includes(u.id) && u.email)
              .map(u => u.email!);
          }
        }
      }
    } else if (recipientType === 'secondary_admins') {
      // Get secondary sector admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles && adminRoles.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('id', adminRoles.map(ar => ar.user_id))
          .eq('sector', 'secondary');
        
        if (profiles && profiles.length > 0) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          if (authData?.users) {
            const adminIds = profiles.map(p => p.id);
            adminEmails = authData.users
              .filter(u => adminIds.includes(u.id) && u.email)
              .map(u => u.email!);
          }
        }
      }
    } else if (recipientType === 'admin' || recipientType === 'all_admins') {
      // Get ALL admin role users including super admins
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (rolesError) {
        console.error('[send-email-notification] Error fetching admin roles:', rolesError);
      }
      
      console.log(`[send-email-notification] Found ${adminRoles?.length || 0} admin roles`);
      
      if (adminRoles && adminRoles.length > 0) {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('[send-email-notification] Error listing auth users:', authError);
        }
        
        if (authData?.users) {
          const adminIds = adminRoles.map(ar => ar.user_id);
          adminEmails = authData.users
            .filter(u => adminIds.includes(u.id) && u.email)
            .map(u => u.email!);
          console.log(`[send-email-notification] Admin emails found:`, adminEmails.length);
        }
      }
      
      // Also include super admins for important notifications
      if (type === 'order' || type === 'deactivation' || type === 'maintenance') {
        const { data: superAdmins } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_super_admin', true);
        
        if (superAdmins && superAdmins.length > 0) {
          const { data: authData } = await supabase.auth.admin.listUsers();
          if (authData?.users) {
            const superAdminIds = superAdmins.map(sa => sa.id);
            const superAdminEmails = authData.users
              .filter(u => superAdminIds.includes(u.id) && u.email)
              .map(u => u.email!);
            // Add unique emails only
            adminEmails = [...new Set([...adminEmails, ...superAdminEmails])];
          }
        }
      }
    }

    // If no admin emails found, log and return
    if (adminEmails.length === 0) {
      console.log("[send-email-notification] No admin emails found for notification type:", recipientType);
      return new Response(
        JSON.stringify({ success: false, message: "No admin emails configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[send-email-notification] Sending ${type} notification to ${adminEmails.length} admin(s):`, adminEmails);

    // Build email HTML
    let detailsHtml = '';
    if (details) {
      detailsHtml = '<table style="margin-top: 16px; border-collapse: collapse; width: 100%;">';
      for (const [key, value] of Object.entries(details)) {
        detailsHtml += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">${key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `;
      }
      detailsHtml += '</table>';
    }

    const typeColors: Record<string, { bg: string; text: string; emoji: string }> = {
      signup: { bg: '#dcfce7', text: '#166534', emoji: '👤' },
      login: { bg: '#dbeafe', text: '#1e40af', emoji: '🔐' },
      order: { bg: '#fef3c7', text: '#92400e', emoji: '🛒' },
      content_alert: { bg: '#fee2e2', text: '#991b1b', emoji: '⚠️' },
      deactivation: { bg: '#fef3c7', text: '#b45309', emoji: '👤' },
      maintenance: { bg: '#e0e7ff', text: '#3730a3', emoji: '🔧' },
      result_upload: { bg: '#dbeafe', text: '#1e40af', emoji: '📊' }
    };

    const colors = typeColors[type] || { bg: '#e5e7eb', text: '#374151', emoji: '🔔' };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #6366f1); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${colors.emoji} Priscilla Connect Notification</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${subject}</p>
          </div>
          <div class="content">
            <span class="badge" style="background: ${colors.bg}; color: ${colors.text};">${type.toUpperCase().replace('_', ' ')}</span>
            <p style="margin-top: 15px;">${message}</p>
            ${detailsHtml}
          </div>
          <div class="footer">
            <p>This is an automated notification from Priscilla Connect SMS.</p>
            <p>© ${new Date().getFullYear()} Priscilla School. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all admins
    const emailPromises = adminEmails.map(async (email) => {
      try {
        console.log(`[send-email-notification] Sending email to: ${email}`);
        const response = await resend.emails.send({
          from: "Priscilla Connect <onboarding@resend.dev>",
          to: [email],
          subject: `[Priscilla Connect] ${subject}`,
          html: emailHtml,
        });
        console.log(`[send-email-notification] Email sent to ${email}:`, response);
        return { email, success: true, response };
      } catch (err) {
        console.error(`[send-email-notification] Failed to send email to ${email}:`, err);
        return { email, success: false, error: err };
      }
    });

    const results = await Promise.all(emailPromises);
    console.log("[send-email-notification] Email results:", JSON.stringify(results));

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: adminEmails.length, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-email-notification] Error in function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);