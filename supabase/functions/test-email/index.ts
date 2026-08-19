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
    const { email, firstName } = await req.json();

    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");

    if (!sendgridApiKey) {
      return new Response(
        JSON.stringify({
          error: "SendGrid API key not configured",
          configured: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: email || "test@example.com" }],
          subject: "Test Email - Fish Digital",
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
            </head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h1>Test Email</h1>
              <p>Hallo ${firstName || "daar"},</p>
              <p>Dit is een test email van Fish Digital om te controleren of de SendGrid integratie werkt.</p>
              <p>Als je deze email ontvangt, dan werkt de configuratie correct! ✓</p>
              <br>
              <p>Met vriendelijke groet,<br>Fish Digital</p>
            </body>
            </html>
          `,
        },
      ],
    };

    const sendgridResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      }
    );

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error("SendGrid error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: errorText,
          status: sendgridResponse.status,
          configured: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test email sent successfully!",
        to: email || "test@example.com",
        configured: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        configured: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});