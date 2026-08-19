import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  tags = [],
}: SEOHeadProps) {
  useEffect(() => {
    document.title = `${title} | Penai.be`;

    const currentUrl = url || window.location.href;
    const defaultImage = image || `${window.location.origin}/PenAI2.png`;

    const metaTags: Record<string, string> = {
      description: description,
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': defaultImage,
      'og:title': title,
      'og:description': description,
      'og:image': defaultImage,
      'og:url': currentUrl,
      'og:type': type,
      'og:site_name': 'Penai.be',
    };

    if (publishedTime) {
      metaTags['article:published_time'] = publishedTime;
    }

    if (modifiedTime) {
      metaTags['article:modified_time'] = modifiedTime;
    }

    if (author) {
      metaTags['article:author'] = author;
    }

    if (tags.length > 0) {
      tags.forEach((tag, index) => {
        metaTags[`article:tag:${index}`] = tag;
      });
    }

    Object.entries(metaTags).forEach(([name, content]) => {
      let meta = document.querySelector(`meta[name="${name}"]`) ||
                 document.querySelector(`meta[property="${name}"]`);

      if (!meta) {
        meta = document.createElement('meta');
        const isOg = name.startsWith('og:') || name.startsWith('article:');
        if (isOg) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    });

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = currentUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = currentUrl;
      document.head.appendChild(link);
    }

    return () => {
      document.title = 'Penai.be';
    };
  }, [title, description, image, url, type, publishedTime, modifiedTime, author, tags]);

  return null;
}

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  datePublished: string;
  dateModified: string;
  author: string;
  tags?: string[];
}

export function ArticleStructuredData({
  title,
  description,
  image,
  url,
  datePublished,
  dateModified,
  author,
  tags = [],
}: ArticleStructuredDataProps) {
  useEffect(() => {
    const currentUrl = url || window.location.href;
    const defaultImage = image || `${window.location.origin}/PenAI2.png`;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      image: defaultImage,
      datePublished: datePublished,
      dateModified: dateModified,
      author: {
        '@type': 'Person',
        name: 'Penai.be',
        email: author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Penai.be',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/PenAI.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl,
      },
      keywords: tags.join(', '),
    };

    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.textContent = JSON.stringify(structuredData);
    } else {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.querySelector('script[type="application/ld+json"]');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, image, url, datePublished, dateModified, author, tags]);

  return null;
}
