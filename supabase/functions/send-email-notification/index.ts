import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: 'signup' | 'login' | 'order' | 'content_alert';
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

    const { type, recipientType, subject, message, details }: EmailNotificationRequest = await req.json();

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
          .badge-signup { background: #dcfce7; color: #166534; }
          .badge-login { background: #dbeafe; color: #1e40af; }
          .badge-order { background: #fef3c7; color: #92400e; }
          .badge-alert { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 Priscilla Connect Notification</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${subject}</p>
          </div>
          <div class="content">
            <span class="badge badge-${type}">${type.toUpperCase()}</span>
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

    // For now, send to a configured admin email or log
    // In production, you would fetch admin emails from the database
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@priscillaschool.com";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Priscilla Connect <notifications@resend.dev>",
        to: [adminEmail],
        subject: `[Priscilla Connect] ${subject}`,
        html: emailHtml,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
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
