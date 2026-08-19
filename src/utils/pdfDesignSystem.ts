export const brandColors = {
  primary: '#0066CC',
  primaryLight: '#3399FF',
  primaryDark: '#004C99',
  gray: '#666666',
  grayLight: '#F5F5F5',
  grayDark: '#333333',
  white: '#FFFFFF',
  black: '#000000',
};

export const fonts = {
  heading: "'Inter', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

export function generatePDFStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: ${fonts.body};
      color: ${brandColors.grayDark};
      line-height: 1.8;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 25mm;
      background: white;
      position: relative;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .cover-page {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40mm 25mm;
      position: relative;
      overflow: hidden;
    }

    .cover-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.3;
      z-index: 0;
    }

    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0, 102, 204, 0.95) 0%, rgba(0, 76, 153, 0.95) 100%);
      z-index: 1;
    }

    .cover-content {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-title {
      font-size: 48px;
      font-weight: 800;
      color: ${brandColors.white};
      line-height: 1.2;
      margin-bottom: 20px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .cover-subtitle {
      font-size: 20px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .cover-meta {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 40px;
    }

    .cover-footer {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.3);
    }

    .cover-logo {
      height: 40px;
      filter: brightness(0) invert(1);
    }

    .cover-date {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }

    .toc-page {
      padding: 40mm 25mm;
    }

    .toc-title {
      font-size: 36px;
      font-weight: 700;
      color: ${brandColors.primary};
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 3px solid ${brandColors.primary};
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid ${brandColors.grayLight};
      text-decoration: none;
      color: ${brandColors.grayDark};
      transition: all 0.2s;
    }

    .toc-item:hover {
      background: ${brandColors.grayLight};
      padding-left: 10px;
    }

    .toc-chapter-number {
      font-weight: 600;
      color: ${brandColors.primary};
      margin-right: 10px;
    }

    .toc-chapter-title {
      flex: 1;
      font-weight: 500;
    }

    .toc-page-number {
      font-weight: 500;
      color: ${brandColors.gray};
    }

    .content-page {
      position: relative;
    }

    .chapter-header {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${brandColors.primary};
    }

    .chapter-number {
      font-size: 14px;
      font-weight: 600;
      color: ${brandColors.primary};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .chapter-title {
      font-size: 36px;
      font-weight: 700;
      color: ${brandColors.grayDark};
      line-height: 1.3;
      margin-bottom: 15px;
    }

    .chapter-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .content h1, .content h2, .content h3 {
      font-weight: 700;
      color: ${brandColors.grayDark};
      margin-top: 30px;
      margin-bottom: 15px;
      page-break-after: avoid;
    }

    .content h1 {
      font-size: 32px;
      color: ${brandColors.primary};
      border-bottom: 2px solid ${brandColors.primary};
      padding-bottom: 10px;
    }

    .content h2 {
      font-size: 26px;
    }

    .content h3 {
      font-size: 20px;
      color: ${brandColors.gray};
    }

    .content p {
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 20px;
      text-align: justify;
      color: ${brandColors.grayDark};
    }

    .content ul, .content ol {
      margin: 20px 0 20px 30px;
    }

    .content li {
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 10px;
      color: ${brandColors.grayDark};
    }

    .highlight-box {
      background: ${brandColors.grayLight};
      border-left: 4px solid ${brandColors.primary};
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }

    .highlight-box p {
      margin-bottom: 0;
      font-weight: 500;
    }

    .page-footer {
      position: absolute;
      bottom: 15mm;
      left: 25mm;
      right: 25mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 15px;
      border-top: 1px solid ${brandColors.grayLight};
      font-size: 11px;
      color: ${brandColors.gray};
    }

    .footer-logo {
      height: 20px;
      opacity: 0.6;
    }

    .footer-text {
      font-size: 11px;
      color: ${brandColors.gray};
    }

    .page-number {
      font-weight: 500;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }
    }
  `;
}

export function generateCoverPage(title: string, subtitle: string, imageUrl?: string): string {
  const currentDate = new Date().toLocaleDateString('nl-BE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <div class="page cover-page">
      ${imageUrl ? `<img src="${imageUrl}" alt="Cover" class="cover-image" />` : ''}
      <div class="cover-overlay"></div>
      <div class="cover-content">
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="cover-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      <div class="cover-footer">
        <div class="footer-text">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 5px;">PenAI.be</div>
          <div>Professionele content, automatisch gegenereerd</div>
        </div>
        <div class="cover-date">${currentDate}</div>
      </div>
    </div>
  `;
}

export function generateTableOfContents(chapters: Array<{title: string, page?: number}>): string {
  const items = chapters.map((chapter, index) => `
    <div class="toc-item">
      <span class="toc-chapter-number">${index + 1}.</span>
      <span class="toc-chapter-title">${escapeHtml(chapter.title)}</span>
      <span class="toc-page-number">${chapter.page || index + 3}</span>
    </div>
  `).join('');

  return `
    <div class="page toc-page">
      <h2 class="toc-title">Inhoudsopgave</h2>
      ${items}
    </div>
  `;
}

export function generateChapterPage(
  chapterNumber: number,
  title: string,
  content: string,
  pageNumber: number,
  imageUrl?: string
): string {
  const formattedContent = formatContent(content);

  return `
    <div class="page content-page">
      <div class="chapter-header">
        <div class="chapter-number">Hoofdstuk ${chapterNumber}</div>
        <h2 class="chapter-title">${escapeHtml(title)}</h2>
      </div>
      ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(title)}" class="chapter-image" />` : ''}
      <div class="content">
        ${formattedContent}
      </div>
      <div class="page-footer">
        <div class="footer-text">Gegenereerd met PenAI.be</div>
        <div class="page-number">${pageNumber}</div>
      </div>
    </div>
  `;
}

function formatContent(content: string): string {
  let formatted = escapeHtml(content);

  formatted = formatted.replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>');
  formatted = formatted.replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  const paragraphs = formatted.split('\n\n');
  formatted = paragraphs.map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<h')) return para;
    if (para.startsWith('-')) {
      const items = para.split('\n').filter(line => line.trim());
      const listItems = items.map(item => `<li>${item.replace(/^-\s*/, '')}</li>`).join('');
      return `<ul>${listItems}</ul>`;
    }
    return `<p>${para}</p>`;
  }).join('\n');

  return formatted;
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

export function generateCompletePDF(
  title: string,
  subtitle: string,
  chapters: Array<{title: string, content: string}>,
  coverImageUrl?: string,
  chapterImages?: string[]
): string {
  const styles = generatePDFStyles();
  const coverPage = generateCoverPage(title, subtitle, coverImageUrl);
  const tocPage = generateTableOfContents(chapters);

  const chapterPages = chapters.map((chapter, index) =>
    generateChapterPage(
      index + 1,
      chapter.title,
      chapter.content,
      index + 3,
      chapterImages?.[index]
    )
  ).join('\n');

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
  ${coverPage}
  ${tocPage}
  ${chapterPages}
</body>
</html>
  `;
}
