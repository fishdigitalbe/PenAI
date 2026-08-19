import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PublishRequest {
  orderId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { orderId }: PublishRequest = await req.json();

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, customers(user_id)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.customers?.user_id !== user.id) {
      throw new Error("Unauthorized - not your order");
    }

    if (!order.generated_content) {
      throw new Error("No content available to publish");
    }

    const { data: shopifyStore, error: shopifyError } = await supabaseClient
      .from("shopify_stores")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (shopifyError || !shopifyStore) {
      throw new Error("No active Shopify store found. Please connect a store first.");
    }

    const contentData = typeof order.generated_content === 'string'
      ? JSON.parse(order.generated_content)
      : order.generated_content;

    // Helper function to convert markdown links to HTML
    function convertMarkdownLinksToHtml(text: string): string {
      // Convert [text](url) to <a href="url">text</a>
      return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }

    let htmlContent = "";
    if (contentData.chapters && Array.isArray(contentData.chapters)) {
      htmlContent = contentData.chapters
        .map((chapter: any) => {
          let chapterHtml = `<h2>${chapter.title}</h2>`;

          if (chapter.image?.url) {
            chapterHtml += `<img src="${chapter.image.url}" alt="${chapter.title}" style="max-width: 100%; height: auto; margin: 20px 0;" />`;
            if (chapter.image.photographer) {
              chapterHtml += `<p style="font-size: 12px; color: #666;">Photo by <a href="${chapter.image.photographerUrl}" target="_blank">${chapter.image.photographer}</a></p>`;
            }
          }

          // Convert markdown links to HTML and line breaks
          const contentWithLinks = convertMarkdownLinksToHtml(chapter.content);
          chapterHtml += `<div>${contentWithLinks.replace(/\n/g, '<br>')}</div>`;
          return chapterHtml;
        })
        .join("\n");
    } else {
      htmlContent = contentData.content || JSON.stringify(order.generated_content);
    }

    // First, get or create a blog
    const blogsUrl = `https://${shopifyStore.shop_name}/admin/api/2024-01/blogs.json`;
    const blogsResponse = await fetch(blogsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyStore.access_token,
      },
    });

    if (!blogsResponse.ok) {
      const errorData = await blogsResponse.text();
      console.error("Shopify API error (blogs):", errorData);
      throw new Error(`Failed to fetch Shopify blogs: ${blogsResponse.status} - ${errorData}`);
    }

    const blogsData = await blogsResponse.json();
    let blogId: number;

    if (blogsData.blogs && blogsData.blogs.length > 0) {
      blogId = blogsData.blogs[0].id;
    } else {
      // Create a blog if none exists
      const createBlogResponse = await fetch(blogsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyStore.access_token,
        },
        body: JSON.stringify({
          blog: {
            title: "News",
          },
        }),
      });

      if (!createBlogResponse.ok) {
        const errorData = await createBlogResponse.text();
        console.error("Shopify API error (create blog):", errorData);
        throw new Error(`Failed to create Shopify blog: ${createBlogResponse.status} - ${errorData}`);
      }

      const newBlogData = await createBlogResponse.json();
      blogId = newBlogData.blog.id;
    }

    // Now create the blog post (article)
    const articleUrl = `https://${shopifyStore.shop_name}/admin/api/2024-01/blogs/${blogId}/articles.json`;

    const generationParams = typeof order.generation_params === 'string'
      ? JSON.parse(order.generation_params)
      : order.generation_params;

    const article = {
      article: {
        title: contentData.title || generationParams?.subject || "Untitled Blog Post",
        body_html: htmlContent,
        tags: generationParams?.targetAudience || "",
        published: true,
      },
    };

    const shopifyResponse = await fetch(articleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyStore.access_token,
      },
      body: JSON.stringify(article),
    });

    if (!shopifyResponse.ok) {
      const errorData = await shopifyResponse.text();
      console.error("Shopify API error (article):", errorData);
      throw new Error(`Failed to publish to Shopify: ${shopifyResponse.status} - ${errorData}`);
    }

    const shopifyData = await shopifyResponse.json();

    await supabaseClient
      .from("orders")
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Blog successfully published to Shopify!",
        articleId: shopifyData.article?.id,
        shopUrl: `https://${shopifyStore.shop_name}/blogs/${blogId}/articles/${shopifyData.article?.id}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error publishing to Shopify:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to publish to Shopify",
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
