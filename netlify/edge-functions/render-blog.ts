import type { Context } from "https://edge.netlify.com";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY");

function isBot(userAgent: string): boolean {
  const botPatterns = [
    'googlebot',
    'google-structured-data-testing-tool',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkshare',
    'w3c_validator',
    'whatsapp'
  ];

  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

async function fetchBlogData(slug: string) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blogs?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching blog:', error);
    return null;
  }
}

function generateBlogHTML(blog: any): string {
  const title = blog.title || 'Blog Post';
  const description = blog.excerpt || blog.meta_description || '';
  const image = blog.featured_image || 'https://penai.be/PenAI2.png';
  const url = `https://penai.be/blog/${blog.slug}`;
  const publishedTime = blog.created_at || new Date().toISOString();
  const modifiedTime = blog.updated_at || publishedTime;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | Penai.be</title>
    <meta name="description" content="${description}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="Penai.be" />
    <meta property="article:published_time" content="${publishedTime}" />
    <meta property="article:modified_time" content="${modifiedTime}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Canonical -->
    <link rel="canonical" href="${url}" />

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title}",
      "description": "${description}",
      "image": "${image}",
      "datePublished": "${publishedTime}",
      "dateModified": "${modifiedTime}",
      "author": {
        "@type": "Person",
        "name": "Penai.be",
        "email": "${blog.author_email || 'info@penai.be'}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Penai.be",
        "logo": {
          "@type": "ImageObject",
          "url": "https://penai.be/PenAI.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${url}"
      }
    }
    </script>

    <link rel="sitemap" type="application/xml" href="https://penai.be/sitemap.xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <noscript>
      <h1>${title}</h1>
      <div>${blog.content || ''}</div>
    </noscript>
    <div id="root"></div>
    <script type="module" src="/assets/index-DE8KgPAQ.js"></script>
    <link rel="stylesheet" href="/assets/index-BrDgTzX_.css">
  </body>
</html>`;
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  // Check if this is a blog post URL
  const blogMatch = url.pathname.match(/^\/blog\/([^\/]+)$/);

  if (!blogMatch) {
    // Not a blog post, continue to next handler
    return;
  }

  // Check if this is a bot
  if (!isBot(userAgent)) {
    // Not a bot, serve the regular SPA
    return;
  }

  // This is a bot viewing a blog post, let's pre-render it
  const slug = blogMatch[1];
  const blog = await fetchBlogData(slug);

  if (!blog) {
    // Blog not found, continue to regular handling
    return;
  }

  // Return pre-rendered HTML for bots
  return new Response(generateBlogHTML(blog), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};

export const config = { path: "/blog/*" };
