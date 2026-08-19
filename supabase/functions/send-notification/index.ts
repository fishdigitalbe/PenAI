import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, firstName, subject, orderId } = await req.json();

    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) {
      throw new Error("SendGrid API key not configured");
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email }],
          subject: `Uw ebook "${subject}" is klaar!`,
        },
      ],
      from: {
        email: "info@fishdigital.be",
        name: "Fishdigital - Ebook generator",
      },
      content: [
        {
          type: "text/html",
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
                  color: white;
                  padding: 40px 20px;
                  border-radius: 8px 8px 0 0;
                  text-align: center;
                }
                .content {
                  background: #f8fafc;
                  padding: 40px 30px;
                  border-radius: 0 0 8px 8px;
                }
                .button {
                  display: inline-block;
                  background: #0EA5E9;
                  color: white !important;
                  padding: 14px 32px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: bold;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e2e8f0;
                  color: #64748b;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Uw ebook is klaar!</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; margin-top: 0;">Beste ${firstName},</p>

                <p>Goed nieuws! Uw gepersonaliseerde ebook over <strong>"${subject}"</strong> is succesvol gegenereerd en staat nu klaar in uw klantenzone.</p>

                <p><strong>Wat vindt u in uw klantenzone?</strong></p>
                <ul style="line-height: 2;">
                  <li>Uw volledige ebook met alle hoofdstukken</li>
                  <li>Alle gegenereerde visuals en afbeeldingen</li>
                  <li>Social media advertentieteksten voor promotie</li>
                  <li>Download mogelijkheden (HTML formaat)</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get("FRONTEND_URL") || "https://www.write-ebooks.com"}/portal" class="button">
                    Ga naar mijn klantenzone
                  </a>
                </div>

                <p style="background: #e0f2fe; border-left: 4px solid #0EA5E9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <strong>💡 Tip:</strong> Bookmark uw klantenzone voor snelle toegang tot al uw ebooks en content.
                </p>

                <div class="footer">
                  <p>Met vriendelijke groeten,<br><strong>Het Fish Digital team</strong></p>
                  <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
                    Dit is een automatisch gegenereerd bericht.<br>
                    Order ID: ${orderId}
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log(`Notification email sent to ${email} for order ${orderId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification email sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
