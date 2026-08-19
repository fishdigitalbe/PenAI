import { GenerationResult } from '../types';

export async function generatePDF(result: GenerationResult): Promise<void> {
  const hasSeoData = result.metadata && result.metadata.jsonLd;
  const jsonLdData = hasSeoData ? JSON.parse(result.metadata.jsonLd!) : null;
  const lang = jsonLdData?.inLanguage || 'nl';
  const author = result.metadata?.author || 'Expert Author';
  const organization = result.metadata?.organization || author;
  const websiteUrl = 'https://penai.fish-digital.io';
  const contactEmail = 'info@fish-digital.io';
  const phoneNumber = '+32 477 32 77 50';

  // Generate table of contents
  const tocEntries = result.chapters.map((chapter, index) => {
    const pageNumber = String(index + 1).padStart(2, '0');
    return `
        <dt>${pageNumber}</dt>
        <dd>${escapeHtml(chapter.title)}</dd>`;
  }).join('');

  // Split chapters into groups of 3 for three-column layout
  const chunkedToc: string[][] = [];
  for (let i = 0; i < result.chapters.length; i += 5) {
    chunkedToc.push(result.chapters.slice(i, i + 5).map((ch, idx) => {
      const pageNumber = String(i + idx + 1).padStart(2, '0');
      return `
          <dt>${pageNumber}</dt>
          <dd>${escapeHtml(ch.title)}</dd>`;
    }));
  }

  const tocColumns = chunkedToc.map(group => `
      <dl>${group.join('')}
      </dl>`).join('');

  // Generate chapter pages
  const chapterPages = result.chapters.map((chapter, index) => {
    const lines = chapter.content.split('\n');
    let contentHtml = '';
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      // Check for headings
      if (trimmedLine.startsWith('### ')) {
        currentSection += `<h4>${escapeHtml(trimmedLine.substring(4).toUpperCase())}</h4>\n`;
      } else if (trimmedLine.startsWith('## ')) {
        currentSection += `<h4>${escapeHtml(trimmedLine.substring(3).toUpperCase())}</h4>\n`;
      } else {
        currentSection += `<p>${escapeHtml(trimmedLine)}</p>\n`;
      }
    }

    // Determine layout based on whether chapter has an image
    let chapterContent = '';

    if (chapter.image?.url || chapter.pexelsImage?.url) {
      const imageUrl = chapter.image?.url || chapter.pexelsImage?.url;

      // First highlight paragraph
      const firstParagraph = contentHtml || '<p class="highlight">Aenean convallis lorem diam, ut imperdiet lectus ornare eget. Vestibulum consequat aliquam felis, sed porttitor sapien porta et.</p>';

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

  // Bibliography page with references
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
          ${result.chapters[0]?.image?.url || result.chapters[0]?.pexelsImage?.url
            ? `<img src="${result.chapters[0].image?.url || result.chapters[0].pexelsImage?.url}" alt="Bibliography" />`
            : ''}
        </div>
    </div>
</div>`;

  const content = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(result.title)}</title>
  ${result.metadata?.description ? `<meta name="description" content="${escapeHtml(result.metadata.description)}">` : ''}
  ${result.metadata?.keywords?.length ? `<meta name="keywords" content="${result.metadata.keywords.join(', ')}">` : ''}
  ${result.metadata?.author ? `<meta name="author" content="${escapeHtml(result.metadata.author)}">` : ''}

  ${hasSeoData ? `<script type="application/ld+json">
${result.metadata.jsonLd}
  </script>` : ''}

  <style>
    /* Import the desired font from Google fonts. */
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');

    /* Define all colors used in this template */
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
  <!-- Header -->
  <header>
  </header>

  <!-- Footer for standard pages -->
  <footer class="footerStandard">
    <a href="${websiteUrl}">
      penai.fish-digital.io
    </a>
    <hr />
  </footer>

  <!-- Footer for bibliography -->
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

  <!-- Cover Page -->
  <div class="coverPage">
    <h1>${escapeHtml(result.title)}</h1>
    <div class="coverFooter">
      <span>
        <a href="${websiteUrl}">penai.fish-digital.io</a> |
        <a href="mailto:${contactEmail}">${contactEmail}</a> |
        ${phoneNumber}
      </span>
      <hr />
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="tocPage">
    <h1>Inhoudsopgave</h1>
    <hr />
    <div class="threeColumns">
      ${tocColumns}
    </div>
    ${result.chapters[0]?.image?.url || result.chapters[0]?.pexelsImage?.url
      ? `<div class="imageContainer"><img src="${result.chapters[0].image?.url || result.chapters[0].pexelsImage?.url}" alt="Table of Contents" /></div>`
      : ''}
  </div>

  <!-- Chapter Pages -->
  ${chapterPages}

  <!-- Bibliography Page -->
  ${bibliographyContent}
</body>
</html>
  `;

  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 250);
    };
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
