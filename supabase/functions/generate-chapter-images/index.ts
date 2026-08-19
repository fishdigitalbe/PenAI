import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChapterImage {
  url: string;
  photographer: string;
  photographerUrl: string;
}

interface Chapter {
  title?: string;
  summary?: string;
  intro?: string;
  content?: string | unknown;
  image?: ChapterImage | null;
  pexelsImage?: ChapterImage | null;
  [key: string]: any;
}

interface GenerationParams {
  subject?: string;
  targetAudience?: string;
  language?: string;
  toneOfVoice?: string;
  contentType?: "ebook" | "blog";
  contentGoal?: "problem-aware" | "solution-aware" | "product-aware";
  [key: string]: any;
}

interface Order {
  id: string;
  generation_params?: GenerationParams;
  generated_content?: {
    chapters?: Chapter[];
    [key: string]: any;
  };
  [key: string]: any;
}

function buildVisualSearchQueryFromTitle(
  title: string,
  language?: string
): string {
  const raw = (title || "").trim();
  if (!raw) return "abstract business concept illustration";

  const lower = raw.toLowerCase();

  const stopwords = new Set([
    "de", "het", "een", "en", "of", "voor", "van", "met", "zonder", "over", "tot", "door",
    "waarom", "hoe", "wat", "waar", "gids", "handleiding", "belangrijkste", "beste",
    "complete", "ultieme", "stappen", "stap", "tips", "tricks", "trucs", "om", "te", "in",
    "je", "jouw", "uw", "meer", "the", "a", "an", "to", "for", "of", "and", "on", "your",
    "guide", "ultimate", "complete", "reasons", "ways", "how", "why", "top", "best",
  ]);

  const cleanedWords = lower
    .replace(/[:\-–—_|()[\]{}"'!?.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !stopwords.has(w))
    .filter((w) => w.length > 2);

  const keywordPhrase =
    cleanedWords.length > 0 ? cleanedWords.slice(0, 7).join(" ") : raw;

  return `illustration of ${keywordPhrase}`;
}

async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    console.log("Downloading image to convert to base64...");
    const response = await fetch(imageUrl);

    if (!response.ok) {
      console.error("Failed to download image:", response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

async function searchPexelsImage(
  searchQuery: string,
  pexelsApiKey: string,
  retries = 2
): Promise<ChapterImage | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for Pexels search`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      console.log("Searching Pexels for:", searchQuery);

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: pexelsApiKey,
          },
        }
      );

      if (!response.ok) {
        console.error("Pexels API error:", response.status);
        if (response.status === 429 && attempt < retries) {
          console.log("Pexels rate limit hit, will retry...");
          continue;
        }
        if (attempt < retries) {
          continue;
        }
        return null;
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        const photo = data.photos[0];
        const base64Url = await downloadImageAsBase64(photo.src.large);

        if (!base64Url) {
          console.error("Failed to download Pexels image to base64");
          if (attempt < retries) {
            continue;
          }
          return null;
        }

        return {
          url: base64Url,
          photographer: photo.photographer || "Unknown",
          photographerUrl: photo.photographer_url || "",
        };
      }

      return null;
    } catch (error) {
      console.error(`Error searching Pexels (attempt ${attempt + 1}):`, error);
      if (attempt >= retries) {
        return null;
      }
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let orderId: string | undefined;

    try {
      const body = await req.json();
      orderId = body.orderId;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const pexelsApiKey = Deno.env.get("PEXELS_API_KEY");
    if (!pexelsApiKey) {
      throw new Error("PEXELS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: orderRaw, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle<Order>();

    if (fetchError || !orderRaw) {
      console.error("Error fetching order:", fetchError);
      throw new Error("Order not found");
    }

    const order = orderRaw as Order;

    if (!order.generated_content?.chapters) {
      throw new Error("Order has no chapters");
    }

    const generationParams: GenerationParams = order.generation_params || {};
    const chapters = order.generated_content.chapters as Chapter[];
    const updatedChapters: Chapter[] = [...chapters];
    let imagesGenerated = 0;

    const BATCH_SIZE = 5;
    const chaptersToProcess = chapters.filter((ch) => !ch.pexelsImage).length;

    console.log(
      `Processing ${chapters.length} chapters for order ${orderId} - searching Pexels images`
    );
    console.log(`${chaptersToProcess} chapters need Pexels images`);

    const processImages = async () => {
      try {
        let processedInThisBatch = 0;

        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];

          const hasPexelsImage = !!chapter.pexelsImage;

          if (hasPexelsImage) {
            console.log(`Chapter ${i + 1} already has Pexels image, skipping`);
            continue;
          }

          if (processedInThisBatch >= BATCH_SIZE) {
            console.log(`Reached batch limit of ${BATCH_SIZE} chapters, stopping this run`);
            break;
          }

          const chapterTitle = chapter.title || `Chapter ${i + 1}`;

          const pexelsSearchQuery = buildVisualSearchQueryFromTitle(chapterTitle, generationParams.language);

          console.log(
            `Searching Pexels for chapter ${i + 1}: ${chapterTitle}`
          );

          const pexelsImage = await searchPexelsImage(pexelsSearchQuery, pexelsApiKey);

          if (pexelsImage) {
            imagesGenerated++;
            processedInThisBatch++;
            updatedChapters[i] = {
              ...chapter,
              pexelsImage,
            };

            console.log(`Chapter ${i + 1} updated with Pexels image`);
          } else {
            console.log(`No Pexels image found for chapter ${i + 1}`);
            processedInThisBatch++;
          }

          await supabase
            .from("orders")
            .update({
              generated_content: {
                ...order.generated_content,
                chapters: updatedChapters,
              },
            })
            .eq("id", orderId);
        }

        console.log(
          `Batch completed: Generated ${imagesGenerated} images in this run`
        );

        const remainingChapters = updatedChapters.filter(
          (ch) => !ch.pexelsImage
        ).length;

        if (remainingChapters > 0) {
          console.log(
            `${remainingChapters} chapters still need images, triggering next batch...`
          );

          try {
            await fetch(`${supabaseUrl}/functions/v1/generate-chapter-images`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId,
              }),
            });
            console.log("Next batch triggered successfully");
          } catch (error) {
            console.error("Failed to trigger next batch:", error);
          }
        } else {
          console.log(`All chapters complete for order ${orderId}`);
        }
      } catch (error) {
        console.error("Fatal error in processImages:", error);
        await supabase
          .from("orders")
          .update({
            status: "failed",
            error_message:
              error instanceof Error ? error.message : "Image generation failed",
          })
          .eq("id", orderId);
      }
    };

    processImages();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Started searching Pexels images (batch of ${Math.min(
          BATCH_SIZE,
          chaptersToProcess
        )} chapters)`,
        chaptersToProcess,
        totalChapters: chapters.length,
        batchSize: BATCH_SIZE,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing image generation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
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