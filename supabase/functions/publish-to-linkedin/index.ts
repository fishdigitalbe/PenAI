import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { blogId, postText, blogUrl } = await req.json();

    if (!blogId || !postText || !blogUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get blog data to retrieve featured image
    const { data: blogData, error: blogError } = await supabase
      .from("blogs")
      .select("featured_image_url")
      .eq("id", blogId)
      .maybeSingle();

    if (blogError) {
      console.error("Error fetching blog:", blogError);
    }

    const { data: linkedinSettings, error: settingsError } = await supabase
      .from("linkedin_post_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (settingsError || !linkedinSettings) {
      return new Response(
        JSON.stringify({ error: "LinkedIn post settings not found or not active. Please configure your LinkedIn post publishing settings first." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("linkedin_oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "LinkedIn account not connected. Please connect your LinkedIn account in settings." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    let accessToken = tokenData.access_token;

    if (expiresAt <= now) {
      if (!tokenData.refresh_token) {
        return new Response(
          JSON.stringify({ error: "LinkedIn token expired. Please reconnect your LinkedIn account in settings." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const linkedInClientId = Deno.env.get("LINKEDIN_CLIENT_ID");
      const linkedInClientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET");

      if (!linkedInClientId || !linkedInClientSecret) {
        throw new Error("LinkedIn credentials not configured");
      }

      const refreshResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenData.refresh_token,
          client_id: linkedInClientId,
          client_secret: linkedInClientSecret,
        }),
      });

      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh LinkedIn token. Please reconnect your LinkedIn account." }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      await supabase
        .from("linkedin_oauth_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshData.refresh_token || tokenData.refresh_token,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    const linkedinApiUrl = "https://api.linkedin.com/v2/ugcPosts";

    if (!tokenData.person_id) {
      return new Response(
        JSON.stringify({ error: "LinkedIn person ID not found. Please reconnect your LinkedIn account." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const author = linkedinSettings.post_type === 'organization' && linkedinSettings.organization_id
      ? `urn:li:organization:${linkedinSettings.organization_id}`
      : `urn:li:person:${tokenData.person_id}`;

    let linkedinPayload: any = {
      author: author,
      lifecycleState: "PUBLISHED",
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // If there's a featured image, upload it to LinkedIn and use IMAGE type
    if (blogData?.featured_image_url) {
      try {
        // Download the image
        const imageResponse = await fetch(blogData.featured_image_url);
        if (!imageResponse.ok) {
          throw new Error("Failed to download image");
        }
        const imageBlob = await imageResponse.arrayBuffer();

        // Register upload with LinkedIn
        const registerUploadPayload = {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: author,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        };

        const registerResponse = await fetch(
          "https://api.linkedin.com/v2/assets?action=registerUpload",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify(registerUploadPayload),
          }
        );

        if (!registerResponse.ok) {
          throw new Error("Failed to register image upload");
        }

        const registerData = await registerResponse.json();
        const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const asset = registerData.value.asset;

        // Upload the image binary data
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
          body: imageBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        // Use IMAGE media category with the uploaded asset
        linkedinPayload.specificContent = {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: `${postText}\n\n${blogUrl}`,
            },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                media: asset,
              },
            ],
          },
        };
      } catch (imageError) {
        console.error("Error uploading image to LinkedIn:", imageError);
        // Fallback to ARTICLE type if image upload fails
        linkedinPayload.specificContent = {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                originalUrl: blogUrl,
              },
            ],
          },
        };
      }
    } else {
      // No featured image, use ARTICLE type with link preview
      linkedinPayload.specificContent = {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: postText,
          },
          shareMediaCategory: "ARTICLE",
          media: [
            {
              status: "READY",
              originalUrl: blogUrl,
            },
          ],
        },
      };
    }

    const linkedinResponse = await fetch(linkedinApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(linkedinPayload),
    });

    if (!linkedinResponse.ok) {
      const errorData = await linkedinResponse.text();
      console.error("LinkedIn API error:", errorData);
      return new Response(
        JSON.stringify({ error: `LinkedIn API error: ${linkedinResponse.status} - ${errorData}` }),
        {
          status: linkedinResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const linkedinData = await linkedinResponse.json();
    const postId = linkedinData.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    const { error: updateError } = await supabase
      .from("blogs")
      .update({
        linkedin_post_id: postId,
        linkedin_post_url: postUrl,
        linkedin_published_at: new Date().toISOString(),
      })
      .eq("id", blogId);

    if (updateError) {
      console.error("Error updating blog:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        postUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error publishing to LinkedIn:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to publish to LinkedIn" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});