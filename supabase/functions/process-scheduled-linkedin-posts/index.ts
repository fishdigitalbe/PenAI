import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const specificPostId = requestBody.post_id;

    const now = new Date().toISOString();

    let query = supabase
      .from("scheduled_linkedin_posts")
      .select(`
        *,
        blogs (
          id,
          slug,
          featured_image_url
        )
      `)
      .eq("status", "pending");

    if (specificPostId) {
      query = query.eq("id", specificPostId);
    } else {
      query = query.lte("scheduled_for", now);
    }

    const { data: scheduledPosts, error: fetchError } = await query.order("scheduled_for", { ascending: true });

    if (fetchError) {
      console.error("Error fetching scheduled posts:", fetchError);
      throw fetchError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No scheduled posts to process",
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing ${scheduledPosts.length} scheduled posts`);

    const results = [];

    for (const scheduledPost of scheduledPosts) {
      try {
        const { data: tokenData, error: tokenError } = await supabase
          .from("linkedin_oauth_tokens")
          .select("*")
          .eq("user_id", scheduledPost.user_id)
          .maybeSingle();

        if (tokenError || !tokenData) {
          throw new Error("LinkedIn account not connected");
        }

        const expiresAt = new Date(tokenData.expires_at);
        let accessToken = tokenData.access_token;

        if (expiresAt <= new Date()) {
          if (!tokenData.refresh_token) {
            throw new Error("LinkedIn token expired");
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
            throw new Error("Failed to refresh LinkedIn token");
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
            .eq("user_id", scheduledPost.user_id);
        }

        const { data: linkedinSettings, error: settingsError } = await supabase
          .from("linkedin_post_settings")
          .select("*")
          .eq("user_id", scheduledPost.user_id)
          .eq("is_active", true)
          .maybeSingle();

        if (settingsError || !linkedinSettings) {
          throw new Error("LinkedIn post settings not found");
        }

        if (!tokenData.person_id) {
          throw new Error("LinkedIn person ID not found");
        }

        const author = linkedinSettings.post_type === 'organization' && linkedinSettings.organization_id
          ? `urn:li:organization:${linkedinSettings.organization_id}`
          : `urn:li:person:${tokenData.person_id}`;

        const blogUrl = `${Deno.env.get("APP_URL") || "https://penai.be"}/blog/${scheduledPost.blogs.slug}`;

        let linkedinPayload: any = {
          author: author,
          lifecycleState: "PUBLISHED",
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        };

        if (scheduledPost.blogs.featured_image_url) {
          try {
            const imageResponse = await fetch(scheduledPost.blogs.featured_image_url);
            if (!imageResponse.ok) {
              throw new Error("Failed to download image");
            }
            const imageBlob = await imageResponse.arrayBuffer();

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

            linkedinPayload.specificContent = {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: `${scheduledPost.post_text}\n\n${blogUrl}`,
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
            linkedinPayload.specificContent = {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: scheduledPost.post_text,
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
          linkedinPayload.specificContent = {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: scheduledPost.post_text,
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

        const linkedinResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
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
          throw new Error(`LinkedIn API error: ${linkedinResponse.status} - ${errorData}`);
        }

        const linkedinData = await linkedinResponse.json();
        const postId = linkedinData.id;
        const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

        await supabase
          .from("blogs")
          .update({
            linkedin_post_id: postId,
            linkedin_post_url: postUrl,
            linkedin_published_at: new Date().toISOString(),
          })
          .eq("id", scheduledPost.blog_id);

        await supabase
          .from("scheduled_linkedin_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .eq("id", scheduledPost.id);

        console.log(`Successfully published scheduled post ${scheduledPost.id} to LinkedIn`);
        results.push({ id: scheduledPost.id, success: true, postUrl });
      } catch (error: any) {
        console.error(`Error processing scheduled post ${scheduledPost.id}:`, error);

        await supabase
          .from("scheduled_linkedin_posts")
          .update({
            status: "failed",
            error_message: error.message || "Unknown error",
          })
          .eq("id", scheduledPost.id);

        results.push({ id: scheduledPost.id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing scheduled posts:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process scheduled posts" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});