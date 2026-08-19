import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import puppeteer from "npm:puppeteer-core@21.6.1";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Chapter {
  title: string;
  content: string;
  image?: {
    url: string;
    photographer?: string;
    photographerUrl?: string;
  };
  pexelsImage?: {
    url: string;
    photographer?: string;
    photographerUrl?: string;
  };
}

interface PDFGenerationParams {
  orderId: string;
  title: string;
  subject: string;
  chapters: Chapter[];
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

function generateHTML(
  title: string,
  subject: string,
  chapters: Chapter[]
): string {
  const websiteUrl = 'https://penai.fish-digital.io';
  const contactEmail = 'info@fish-digital.io';
  const phoneNumber = '+32 477 32 77 50';

  const chunkedToc: string[][] = [];
  for (let i = 0; i < chapters.length; i += 5) {
    chunkedToc.push(chapters.slice(i, i + 5).map((ch, idx) => {
      const pageNumber = String(i + idx + 1).padStart(2, '0');
      return `
          <dt>${pageNumber}</dt>
          <dd>${escapeHtml(ch.title)}</dd>`;
    }));
  }

  const tocColumns = chunkedToc.map(group => `
      <dl>${group.join('')}
      </dl>`).join('');

  const chapterPages = chapters.map((chapter) => {
    const lines = chapter.content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      if (trimmedLine.startsWith('### ')) {
        currentSection += `<h4>${escapeHtml(trimmedLine.substring(4).toUpperCase())}</h4>\n`;
      } else if (trimmedLine.startsWith('## ')) {
        currentSection += `<h4>${escapeHtml(trimmedLine.substring(3).toUpperCase())}</h4>\n`;
      } else {
        currentSection += `<p>${escapeHtml(trimmedLine)}</p>\n`;
      }
    }

    let chapterContent = '';

    if (chapter.image?.url || chapter.pexelsImage?.url) {
      const imageUrl = chapter.image?.url || chapter.pexelsImage?.url;

      chapterContent = `
<div class="chapterPage">
    <h1>${escapeHtml(chapter.title)}</h1>
    <hr />
    <p class="highlight">
        ${escapeHtml(chapter.content.split('\n')[0] || 'Hoofdstuk introductie')}
    </p>
    <div class="twoColumns">
        <div>
            ${currentSection}
        </div>
        <div class="imageContainerColumns"><img src="${imageUrl}" alt="${escapeHtml(chapter.title)}" /></div>
    </div>
</div>`;
    } else {
      chapterContent = `
<div class="chapterPage">
    <h1>${escapeHtml(chapter.title)}</h1>
    <hr />
    <p class="highlight">
        ${escapeHtml(chapter.content.split('\n')[0] || 'Hoofdstuk introductie')}
    </p>
    <div class="twoTextColumns">
        ${currentSection}
    </div>
</div>`;
    }

    return chapterContent;
  }).join('\n\n');

  const bibliographyContent = `
<div class="bibliographyPage">
    <h1>Bronnen</h1>
    <hr />
    <div class="twoColumns">
        <div>
            <h4>01</h4>
            <p>Gegenereerd met PenAI - Professionele content creatie tool</p>
            <h4>02</h4>
            <p>Voor meer informatie: <a href="${websiteUrl}">${websiteUrl}</a></p>
            <h4>03</h4>
            <p>Contact: <a href="mailto:${contactEmail}">${contactEmail}</a></p>
        </div>
        <div class="imageContainerColumns">
          ${chapters[0]?.image?.url || chapters[0]?.pexelsImage?.url
            ? `<img src="${chapters[0].image?.url || chapters[0].pexelsImage?.url}" alt="Bibliography" />`
            : ''}
        </div>
    </div>
</div>`;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

    :root{
      --highlight-color-one: #1FC2DE;
      --highlight-color-one-transparent: #1FC2DEB3;
      --text-color: #303E48;
      --table-row-separator-color:#CEC3BA;
    }

    @page{
      size:A4;
      margin:2cm 2cm 2.5cm 2cm;
      counter-reset: footnote;

      @top-left{
        content:element(header);
      }

      @bottom-left{
        width:100%;
        content:element(footer);
      }

      @bottom-right{
        font-family: 'Montserrat', sans-serif;
        font-size:8pt;
        font-weight:bold;
        color:var(--highlight-color-one);
        content:counter(page, decimal-leading-zero);
      }

      @footnote {
        border-top:.125mm solid var(--table-row-separator-color);
        padding-top:2mm;
      }
    }

    @page bibliography{
      @bottom-left{
        width:100%;
        content:element(footerBibliography);
      }
    }

    @page:first{
      margin:0;
      background-size:cover;
      background-image:url(https://images.unsplash.com/photo-1497250681960-ef046c08a56e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1834&q=80);

      @top-left{
        content:"";
      }

      @bottom-left{
        content:"";
      }
    }

    body{
      margin:0;
      padding:0;
      color:var(--text-color);
      font-family: 'Montserrat', sans-serif;
      font-size:10pt;
      counter-reset:chapters;
    }

    a{
      color:inherit;
      text-decoration:none;
    }

    hr{
      height:0;
      border:0;
      border-top:.75mm solid var(--highlight-color-one);
      margin:1cm 0 1cm 0;
    }

    header{
      position:running(header);
      height:2cm;
      border-bottom:.5mm solid var(--table-row-separator-color);
    }

    .coverPage,
    .tocPage,
    .chapterPage{
      page-break-after:always;
    }

    .pageBreak{
      page-break-before:always;
      height:1cm;
    }

    .coverPage{
      color:white;
      margin:2cm;
    }

    .coverPage h1{
      margin-top:6cm;
      font-size:64pt;
    }

    .coverPage .coverFooter{
      text-transform:uppercase;
      font-size:8pt;
      display:flex;
      align-items:center;
      justify-content:space-between;
      position:absolute;
      bottom:1cm;
      width:calc(100% - 4cm);
    }

    .coverPage .coverFooter a:first-of-type{
      font-weight:bold;
    }

    .coverPage .coverFooter hr{
      height:.5mm;
      background-color:white;
      border-top:0;
      width:40%;
    }

    .bibliographyPage{
      page: bibliography;
    }

    .chapterPage h1,
    .tocPage h1,
    .bibliographyPage h1{
      margin-top:1cm;
      text-transform:uppercase;
    }

    .chapterPage h1::before,
    .bibliographyPage h1::before{
      counter-increment:chapters;
      content: counter(chapters, decimal-leading-zero) " ";
    }

    .imageContainer{
      max-height:9cm;
      overflow:hidden;
    }

    .imageContainer img{
      max-width:100%;
    }

    .imageContainerColumns{
      overflow:hidden;
      max-height:180mm;
    }

    .imageContainerColumns img{
      max-height:100%;
    }

    .twoColumns,
    .threeColumns{
      display:flex;
      align-items:stretch;
      justify-content:space-between;
      margin:1cm 0 1cm 0;
    }

    .twoColumns > *{
      width:48%;
    }

    .threeColumns > *{
      width:30%;
    }

    .twoTextColumns{
      margin:1cm 0 1cm 0;
      column-count:2;
      column-gap:1cm;
    }

    dl,
    .highlight,
    .highlightLight{
      color:var(--highlight-color-one);
    }

    .highlight{
      font-weight:bold;
      font-size:14pt;
    }

    .imageContainer + .highlight{
      margin-top:1cm;
    }

    h4{
      font-size:10pt;
      margin:0;
    }

    p{
      margin-top:0;
    }

    dt{
      font-size:16pt;
    }

    dd{
      margin:0 0 .5cm 0;
    }

    .footnote {
      float: footnote;
      margin-bottom:2mm;
      color:var(--text-color);
      font-family: 'Montserrat', sans-serif;
      font-size:8pt;
      font-weight:normal;
      footnote-style-position:inside;
    }

    .footerStandard,
    .footerBibliography{
      position:running(footer);
      color:var(--highlight-color-one);
      display:flex;
      align-items:center;
      font-size:8pt;
      text-transform:uppercase;
    }

    footer a:first-of-type{
      font-weight:bold;
    }

    footer hr{
      margin:0 3% 0 3%;
      height:.5mm;
      background-color:var(--highlight-color-one);
      border-top:0;
      width:70%;
      display:inline-block;
    }

    .footerBibliography{
      position:running(footerBibliography);
    }
  </style>
</head>
<body>
  <header>
  </header>

  <footer class="footerStandard">
    <a href="${websiteUrl}">
      penai.fish-digital.io
    </a>
    <hr />
  </footer>

  <footer class="footerBibliography">
    <div>
      <a href="${websiteUrl}">
        penai.fish-digital.io
      </a>
      <br />
      <a href="mailto:${contactEmail}">
        ${contactEmail}
      </a>
      <br />
      <span>
        ${phoneNumber}
      </span>
    </div>
    <hr />
  </footer>

  <div class="coverPage">
    <h1>${escapeHtml(title)}</h1>
    <div class="coverFooter">
      <span>
        <a href="${websiteUrl}">penai.fish-digital.io</a> |
        <a href="mailto:${contactEmail}">${contactEmail}</a> |
        ${phoneNumber}
      </span>
      <hr />
    </div>
  </div>

  <div class="tocPage">
    <h1>Inhoudsopgave</h1>
    <hr />
    <div class="threeColumns">
      ${tocColumns}
    </div>
    ${chapters[0]?.image?.url || chapters[0]?.pexelsImage?.url
      ? `<div class="imageContainer"><img src="${chapters[0].image?.url || chapters[0].pexelsImage?.url}" alt="Table of Contents" /></div>`
      : ''}
  </div>

  ${chapterPages}

  ${bibliographyContent}
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const params: PDFGenerationParams = await req.json();
    let { orderId, title, subject, chapters } = params;

    console.log(`Generating PDF for order ${orderId}`);

    if (!chapters || chapters.length === 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase configuration missing");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('generated_content')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        throw new Error(`Failed to fetch order data: ${orderError?.message || 'Order not found'}`);
      }

      if (!orderData.generated_content?.chapters) {
        throw new Error('No chapters found in order');
      }

      chapters = orderData.generated_content.chapters;
      title = title || orderData.generated_content.title;
      console.log(`Fetched ${chapters.length} chapters from database`);
    }

    const html = generateHTML(title, subject, chapters);

    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });

    await browser.close();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `${orderId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(`orders/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(`orders/${fileName}`);

    const { error: updateError } = await supabase
      .from('orders')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', orderId);

    if (updateError) {
      console.error(`Failed to update order with PDF URL: ${updateError.message}`);
    }

    console.log(`PDF generated successfully for order ${orderId}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.publicUrl,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate PDF",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});