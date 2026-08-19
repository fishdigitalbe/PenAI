import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the base URL from the request
    const url = new URL(req.url);
    const baseUrl = "https://penai.be";

    // Fetch all published blogs
    const { data: blogs, error } = await supabase
      .from("blogs")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
    }

    const publishedBlogs = blogs || [];

    // Static pages with their priorities and change frequencies
    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/blog", priority: "0.9", changefreq: "daily" },
      { path: "/pricing", priority: "0.8", changefreq: "weekly" },
      { path: "/inspiration", priority: "0.7", changefreq: "weekly" },
      { path: "/login", priority: "0.5", changefreq: "monthly" },
      { path: "/signup", priority: "0.5", changefreq: "monthly" },
      { path: "/privacy", priority: "0.3", changefreq: "yearly" },
      { path: "/terms", priority: "0.3", changefreq: "yearly" },
      { path: "/cookies", priority: "0.3", changefreq: "yearly" },
      { path: "/disclaimer", priority: "0.3", changefreq: "yearly" },
      { path: "/withdrawal", priority: "0.3", changefreq: "yearly" },
    ];

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Add blog posts
    for (const blog of publishedBlogs) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/blog/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});