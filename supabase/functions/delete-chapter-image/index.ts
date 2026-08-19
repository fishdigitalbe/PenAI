import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Chapter {
  title?: string;
  content?: string;
  image?: {
    url: string;
    photographer: string;
    photographerUrl: string;
  } | null;
  pexelsImage?: {
    url: string;
    photographer: string;
    photographerUrl: string;
  } | null;
  uploadedImage?: {
    url: string;
  } | null;
  [key: string]: any;
}

interface Order {
  id: string;
  generated_content?: {
    chapters?: Chapter[];
    [key: string]: any;
  };
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let orderId, chapterIndex, imageType;
    try {
      const body = await req.json();
      orderId = body.orderId;
      chapterIndex = body.chapterIndex;
      imageType = body.imageType || 'ai';
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
        }),
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

    if (chapterIndex === undefined || chapterIndex === null) {
      throw new Error("Chapter index is required");
    }

    if (imageType !== 'ai' && imageType !== 'pexels' && imageType !== 'uploaded') {
      throw new Error("Invalid image type. Must be 'ai', 'pexels', or 'uploaded'");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const chapters = order.generated_content.chapters as Chapter[];

    if (chapterIndex < 0 || chapterIndex >= chapters.length) {
      throw new Error("Invalid chapter index");
    }

    const imageField = imageType === 'ai' ? 'image' : imageType === 'pexels' ? 'pexelsImage' : 'uploadedImage';

    if (!chapters[chapterIndex][imageField]) {
      throw new Error(`Chapter has no ${imageType} image to delete`);
    }

    console.log(`Deleting ${imageType} image for chapter ${chapterIndex} in order ${orderId}`);

    // Remove the image from the chapter by setting it to null instead of deleting the key
    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      [imageField]: null,
    };

    console.log(`Updating order with modified chapters...`);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        generated_content: {
          ...order.generated_content,
          chapters: chapters,
        },
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      console.error("Error details:", JSON.stringify(updateError, null, 2));
      throw new Error(`Failed to update order: ${updateError.message || 'Unknown error'}`);
    }

    console.log(`Successfully deleted ${imageType} image for chapter ${chapterIndex}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${imageType === 'ai' ? 'AI' : imageType === 'pexels' ? 'Pexels' : 'Uploaded'} image deleted successfully`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting chapter image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to delete image",
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