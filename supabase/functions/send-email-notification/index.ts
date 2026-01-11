import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: 'signup' | 'login' | 'order' | 'content_alert' | 'deactivation';
  recipientType: 'super_admin' | 'admin' | 'all_admins';
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

    // Initialize Supabase client to fetch admin emails
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, recipientType, subject, message, details }: EmailNotificationRequest = await req.json();

    // Fetch admin emails from database based on recipient type
    let adminEmails: string[] = [];
    
    if (recipientType === 'super_admin') {
      // Get super admin emails
      const { data: superAdmins } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_super_admin', true);
      
      if (superAdmins && superAdmins.length > 0) {
        // Get emails from auth.users
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        if (authUsers?.users) {
          const superAdminIds = superAdmins.map(sa => sa.id);
          adminEmails = authUsers.users
            .filter(u => superAdminIds.includes(u.id) && u.email)
            .map(u => u.email!);
        }
      }
    } else if (recipientType === 'admin' || recipientType === 'all_admins') {
      // Get all admin role users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminRoles && adminRoles.length > 0) {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        if (authUsers?.users) {
          const adminIds = adminRoles.map(ar => ar.user_id);
          adminEmails = authUsers.users
            .filter(u => adminIds.includes(u.id) && u.email)
            .map(u => u.email!);
        }
      }
    }

    // If no admin emails found, log and return
    if (adminEmails.length === 0) {
      console.log("No admin emails found for notification type:", recipientType);
      return new Response(
        JSON.stringify({ success: false, message: "No admin emails configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending ${type} notification to ${adminEmails.length} admin(s)`);

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

    const typeColors: Record<string, { bg: string; text: string }> = {
      signup: { bg: '#dcfce7', text: '#166534' },
      login: { bg: '#dbeafe', text: '#1e40af' },
      order: { bg: '#fef3c7', text: '#92400e' },
      content_alert: { bg: '#fee2e2', text: '#991b1b' },
      deactivation: { bg: '#fef3c7', text: '#b45309' }
    };

    const colors = typeColors[type] || { bg: '#e5e7eb', text: '#374151' };

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
            <h1 style="margin: 0; font-size: 24px;">🔔 Priscilla Connect Notification</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${subject}</p>
          </div>
          <div class="content">
            <span class="badge" style="background: ${colors.bg}; color: ${colors.text};">${type.toUpperCase()}</span>
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
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Priscilla Connect <notifications@resend.dev>",
            to: [email],
            subject: `[Priscilla Connect] ${subject}`,
            html: emailHtml,
          }),
        });
        return response.json();
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err);
        return { error: err };
      }
    });

    const results = await Promise.all(emailPromises);
    console.log("Email results:", results);

    return new Response(
      JSON.stringify({ success: true, sent: adminEmails.length, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification function:", error);
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