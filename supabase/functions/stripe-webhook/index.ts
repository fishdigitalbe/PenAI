import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const session = stripeData as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          console.error('No order_id found in session metadata');
          return;
        }

        console.info(`Processing payment for order: ${orderId}`);

        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('*, customers(*)')
          .eq('id', orderId)
          .maybeSingle();

        if (fetchError || !order) {
          console.error('Error fetching order:', fetchError);
          return;
        }

        const isTestOrder = session.metadata?.is_test === 'true';

        if (isTestOrder) {
          console.info(`Test order detected - skipping ebook generation`);
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string,
              completed_at: new Date().toISOString(),
            })
            .eq('id', orderId);
          console.info(`Successfully processed test payment for order: ${orderId}`);
          return;
        }

        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', orderId);

        if (order.customers.user_id) {
          console.info(`Tracking LinkedIn conversion for order: ${orderId}`);
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/track-linkedin-conversion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              orderId: orderId,
              userId: order.customers.user_id,
              email: order.customers.email,
              conversionValue: order.amount / 100,
              eventType: 'PURCHASE',
            }),
          }).catch((error) => {
            console.error('Error tracking LinkedIn conversion:', error);
          });

          console.info(`Tracking Meta conversion for order: ${orderId}`);
          fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/track-meta-conversion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              orderId: orderId,
              userId: order.customers.user_id,
              email: order.customers.email,
              firstName: order.customers.first_name,
              lastName: order.customers.last_name,
              phone: order.customers.phone,
              city: order.customers.city,
              country: order.customers.country,
              postalCode: order.customers.postal_code,
              conversionValue: order.amount / 100,
              currency: 'EUR',
              eventType: 'Purchase',
            }),
          }).catch((error) => {
            console.error('Error tracking Meta conversion:', error);
          });
        }

        console.info(`Triggering async ebook generation for order: ${orderId}`);

        fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ebook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify(order.generation_params),
        }).then(async (ebookResponse) => {
          if (!ebookResponse.ok) {
            throw new Error(`Ebook generation failed: ${await ebookResponse.text()}`);
          }

          const ebookResult = await ebookResponse.json();

          await supabase
            .from('orders')
            .update({
              generated_content: {
                title: order.generation_params.subject,
                wordCount: ebookResult.wordCount,
                chapters: ebookResult.chapters,
              },
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          console.info(`Ebook generation completed for order: ${orderId}`);

          console.info(`Generating PDF for order: ${orderId}`);
          let pdfUrl = null;
          try {
            const pdfResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-pdf`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                orderId: orderId,
                title: order.generation_params.subject,
                subject: order.generation_params.subject,
                chapters: ebookResult.chapters,
              }),
            });

            if (pdfResponse.ok) {
              const pdfData = await pdfResponse.json();
              pdfUrl = pdfData.pdfUrl;
              console.info(`PDF generated successfully: ${pdfUrl}`);
            } else {
              console.error('Failed to generate PDF:', await pdfResponse.text());
            }
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
          }

          console.info(`Sending ebook email for order: ${orderId}`);
          await sendEbookEmail(
            order.customers.email,
            order.customers.first_name,
            {
              title: order.generation_params.subject,
              wordCount: ebookResult.wordCount,
              chapters: ebookResult.chapters,
              generatedAt: new Date().toISOString(),
            },
            order.generation_params.subject,
            order,
            pdfUrl
          );

          await supabase
            .from('orders')
            .update({ email_sent: true })
            .eq('id', orderId);

          console.info(`Successfully processed payment and sent ebook for order: ${orderId}`);
        }).catch(async (error) => {
          console.error('Error during async ebook generation:', error);
          await supabase
            .from('orders')
            .update({
              status: 'failed',
            })
            .eq('id', orderId);
        });

        console.info(`Order ${orderId} queued for async processing`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

function generateInvoiceNumber(orderId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const orderShort = orderId.substring(0, 8).toUpperCase();
  return `INV-${year}${month}-${orderShort}`;
}

function generateInvoiceHTML(order: any): string {
  const invoiceNumber = generateInvoiceNumber(order.id);
  const invoiceDate = new Date().toLocaleDateString('nl-BE');
  const amount = order.amount / 100;
  const btw = amount * 0.21;
  const total = amount + btw;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0EA5E9;
        }
        .company-info {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #0EA5E9;
          margin-bottom: 10px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 30px;
          margin-bottom: 10px;
          color: #0284C7;
        }
        .details-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #0EA5E9;
          color: white;
          font-weight: 600;
        }
        .amount {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          background: #f8fafc;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="company-info">
          <div class="invoice-title">FACTUUR</div>
          <strong>Fish Digital</strong><br>
          info@fishdigital.be<br>
        </div>
        <div class="invoice-info">
          <strong>Factuurnummer:</strong> ${invoiceNumber}<br>
          <strong>Factuurdatum:</strong> ${invoiceDate}<br>
        </div>
      </div>

      <div class="section-title">Factuuradres</div>
      <div class="details-box">
        <strong>${order.customers.first_name} ${order.customers.last_name}</strong><br>
        ${order.customers.company_name}<br>
        ${order.customers.address}<br>
        ${order.customers.postal_code} ${order.customers.city}<br>
        ${order.customers.country}<br>
        <strong>BTW:</strong> ${order.customers.vat_number}
      </div>

      <div class="section-title">Omschrijving</div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Omschrijving</th>
            <th class="amount">Bedrag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AI-gegenereerd Ebook</td>
            <td>
              <strong>Onderwerp:</strong> ${order.generation_params.subject}<br>
              <strong>Doelgroep:</strong> ${order.generation_params.targetAudience}<br>
              <strong>Woorden:</strong> ${order.generation_params.wordCount.toLocaleString()}<br>
              <strong>Tone of voice:</strong> ${order.generation_params.toneOfVoice}
            </td>
            <td class="amount">€${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: right;"><strong>Subtotaal:</strong></td>
            <td class="amount">€${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align: right;"><strong>BTW (21%):</strong></td>
            <td class="amount">€${btw.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">TOTAAL:</td>
            <td class="amount">€${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p><strong>Betalingsmethode:</strong> Betaald via Stripe</p>
        <p>Bedankt voor uw bestelling!</p>
      </div>
    </body>
    </html>
  `;
}

async function sendEbookEmail(
  email: string,
  firstName: string,
  content: any,
  subject: string,
  order: any,
  pdfUrl?: string | null
) {
  const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!sendgridApiKey) {
    console.error("SendGrid API key not configured");
    throw new Error("Email service not configured");
  }

  const invoiceHTML = generateInvoiceHTML(order);
  const invoiceBase64 = btoa(unescape(encodeURIComponent(invoiceHTML)));
  const invoiceNumber = generateInvoiceNumber(order.id);

  const emailData = {
    personalizations: [
      {
        to: [{ email }],
        subject: `Uw ebook is klaar: ${subject}`,
      },
    ],
    from: {
      email: "info@fishdigital.be",
      name: "Fish Digital",
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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
                color: white;
                padding: 30px 20px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f8fafc;
                padding: 30px 20px;
                border-radius: 0 0 8px 8px;
              }
              .ebook-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                border: 1px solid #e2e8f0;
              }
              .chapter {
                margin-bottom: 30px;
              }
              .chapter-title {
                color: #0EA5E9;
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .chapter-image {
                width: 100%;
                max-width: 600px;
                height: auto;
                border-radius: 8px;
                margin: 15px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .image-credit {
                font-size: 11px;
                color: #94a3b8;
                margin-top: 5px;
                font-style: italic;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 14px;
              }
              .invoice-notice {
                background: #e0f2fe;
                border: 1px solid #0EA5E9;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Uw ebook is klaar!</h1>
            </div>
            <div class="content">
              <p>Beste ${firstName},</p>
              <p>Uw gepersonaliseerde ebook over <strong>${subject}</strong> is klaar!</p>

              ${pdfUrl ? `
              <div style="background: #0EA5E9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="color: white; margin-bottom: 15px;">📥 Download uw professionele PDF</h3>
                <p style="color: white; margin-bottom: 15px;">Uw ebook is beschikbaar als een prachtig ontworpen PDF met:</p>
                <ul style="color: white; text-align: left; max-width: 400px; margin: 0 auto 15px;">
                  <li>Professionele cover pagina met uw onderwerp</li>
                  <li>Inhoudsopgave met paginanummering</li>
                  <li>Relevante afbeeldingen per hoofdstuk</li>
                  <li>PenAI.be huisstijl en branding</li>
                </ul>
                <a href="${pdfUrl}" style="display: inline-block; background: white; color: #0EA5E9; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Download PDF</a>
              </div>
              ` : ''}

              <div class="invoice-notice">
                <strong>📄 Factuur bijgevoegd</strong><br>
                Uw factuur (${invoiceNumber}) vindt u als bijlage bij deze e-mail.
              </div>

              <p><strong>Details:</strong></p>
              <ul>
                <li>Aantal woorden: ${content.wordCount.toLocaleString()}</li>
                <li>Aantal hoofdstukken: ${content.chapters.length}</li>
                <li>Gegenereerd op: ${new Date(content.generatedAt).toLocaleString('nl-BE')}</li>
              </ul>

              <div class="ebook-content">
                <h2>${content.title}</h2>
                ${content.chapters.map((ch: any) => `
                  <div class="chapter">
                    <div class="chapter-title">${ch.title}</div>
                    ${ch.image ? `
                      <img src="${ch.image.url}" alt="${ch.title}" class="chapter-image" />
                      <div class="image-credit">
                        ${ch.image.photographer}
                      </div>
                    ` : ''}
                    <div>${ch.content.replace(/\n/g, '<br>')}</div>
                  </div>
                `).join('')}
              </div>

              <div class="footer">
                <p>Met vriendelijke groeten,<br>Het Fish Digital team</p>
                <p style="font-size: 12px; color: #94a3b8;">Dit is een automatisch gegenereerd bericht.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    ],
    attachments: [
      {
        content: invoiceBase64,
        filename: `${invoiceNumber}.html`,
        type: "text/html",
        disposition: "attachment",
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

  console.log(`Ebook successfully sent to ${email}`);
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}
