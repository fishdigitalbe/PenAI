import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InfographicRequest {
  orderId: string;
  content: string;
  subject: string;
  style?: 'modern' | 'minimal' | 'colorful' | 'professional';
}

function extractKeyPoints(content: string): string[] {
  const keyPoints: string[] = [];

  const lines = content.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+\.\s/)) {
      const cleaned = trimmed.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        keyPoints.push(cleaned);
        if (keyPoints.length >= 8) break;
      }
    }
  }

  if (keyPoints.length < 3) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

    for (const para of paragraphs) {
      const sentences = para.split(/[.!?]/).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 20 && trimmed.length < 200 && !trimmed.match(/^(http|www)/i);
      });

      for (const sentence of sentences) {
        if (keyPoints.length < 6) {
          keyPoints.push(sentence.trim());
        }
      }

      if (keyPoints.length >= 6) break;
    }
  }

  if (keyPoints.length === 0) {
    const allText = content.replace(/\n+/g, ' ').trim();
    const sentences = allText.split(/[.!?]/).filter(s => {
      const trimmed = s.trim();
      return trimmed.length > 15 && trimmed.length < 200;
    });
    return sentences.slice(0, 6).map(s => s.trim());
  }

  return keyPoints;
}

async function generateInfographicWithDallE(
  subject: string,
  keyPoints: string[],
  style: string,
  openaiApiKey: string
): Promise<string | null> {
  const styleDescriptions = {
    modern: 'modern minimalist design with bold typography, clean lines, geometric shapes, vibrant gradients',
    minimal: 'ultra-minimal black and white design with simple icons, lots of white space, helvetica-style typography',
    colorful: 'vibrant and colorful design with playful illustrations, diverse color palette, engaging visual elements',
    professional: 'professional business design with corporate colors, data visualization elements, clean layout'
  };

  const styleDesc = styleDescriptions[style as keyof typeof styleDescriptions] || styleDescriptions.modern;

  const prompt = `A professional infographic about "${subject}". ${styleDesc}.

Key points to visualize:
${keyPoints.slice(0, 6).map((point, i) => `${i + 1}. ${point}`).join('\n')}

Design requirements:
- Vertical layout optimized for social media (portrait orientation, 1080x1920)
- Clear visual hierarchy with "${subject}" as title at the top
- Each of the ${Math.min(keyPoints.length, 6)} key points has its own section with icons or visual elements
- Professional typography with readable fonts
- Balanced composition with proper spacing
- Include numbered sections for each key point
- Clean infographic style with data visualization elements
- "Created with PenAI" watermark at the bottom`;

  try {
    console.log("Attempting DALL-E 3 infographic generation...");
    console.log("Prompt length:", prompt.length);

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1792",
          quality: "standard",
          response_format: "url"
        }),
      }
    );

    console.log("DALL-E response status:", response.status);

    if (!response.ok) {
      let errorText = "Unknown error";
      try {
        errorText = await response.text();
      } catch (e) {
        console.error("Could not read error response:", e);
      }
      console.error("DALL-E API error:", response.status, errorText);
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Failed to parse DALL-E response as JSON:", jsonError);
      const textResponse = await response.text();
      console.error("Response text:", textResponse.substring(0, 200));
      return null;
    }

    console.log("DALL-E response received, has data:", !!data.data);

    if (data.data?.[0]?.url) {
      const imageUrl = data.data[0].url;
      console.log("Successfully generated infographic with DALL-E, fetching image...");

      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error("Failed to fetch generated image:", imageResponse.status);
          return null;
        }

        const imageBlob = await imageResponse.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));
        console.log("Image downloaded and converted to base64");
        return `data:image/png;base64,${base64Image}`;
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError);
        return null;
      }
    }

    console.log("No image URL in DALL-E response");
    return null;
  } catch (error) {
    console.error("Error with DALL-E API (outer catch):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}

function generateInfographicSVG(
  subject: string,
  keyPoints: string[],
  style: string
): string {
  const styles = {
    modern: {
      primary: '#667eea',
      secondary: '#764ba2',
      textColor: '#ffffff',
      cardBg: '#ffffff',
      cardOpacity: '0.15'
    },
    minimal: {
      primary: '#2d3748',
      secondary: '#4a5568',
      textColor: '#1a202c',
      cardBg: '#f7fafc',
      cardOpacity: '0.9'
    },
    colorful: {
      primary: '#f093fb',
      secondary: '#f5576c',
      textColor: '#ffffff',
      cardBg: '#ffffff',
      cardOpacity: '0.2'
    },
    professional: {
      primary: '#4facfe',
      secondary: '#00f2fe',
      textColor: '#ffffff',
      cardBg: '#ffffff',
      cardOpacity: '0.15'
    }
  };

  const selectedStyle = styles[style as keyof typeof styles] || styles.modern;
  const pointsToShow = keyPoints.slice(0, 6);

  const escapeXml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const wrapText = (text: string, maxLength: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxLength) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines.slice(0, 2);
  };

  const titleLines = wrapText(subject, 30);

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${selectedStyle.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${selectedStyle.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1080" height="1920" fill="url(#bgGrad)"/>

  ${titleLines.map((line, idx) => `
  <text x="540" y="${150 + (idx * 70)}" font-family="Arial, sans-serif" font-size="56" font-weight="bold"
        fill="${selectedStyle.textColor}" text-anchor="middle">
    ${escapeXml(line)}
  </text>`).join('')}

  ${pointsToShow.map((point, index) => {
    const y = 380 + (index * 230);
    const iconY = y - 30;
    const textLines = wrapText(point, 50);

    return `
  <rect x="80" y="${y - 90}" width="920" height="200" rx="20"
        fill="${selectedStyle.cardBg}" opacity="${selectedStyle.cardOpacity}"/>

  <circle cx="160" cy="${iconY}" r="40" fill="${selectedStyle.textColor}" opacity="0.25"/>
  <text x="160" y="${iconY + 15}" font-family="Arial, sans-serif" font-size="42"
        font-weight="bold" fill="${selectedStyle.textColor}" text-anchor="middle">
    ${index + 1}
  </text>

  ${textLines.map((line, lineIdx) => `
  <text x="240" y="${y - 30 + (lineIdx * 45)}" font-family="Arial, sans-serif" font-size="32"
        fill="${selectedStyle.textColor}" font-weight="500">
    ${escapeXml(line)}
  </text>`).join('')}
    `;
  }).join('')}

  <text x="540" y="1840" font-family="Arial, sans-serif" font-size="28"
        fill="${selectedStyle.textColor}" text-anchor="middle" opacity="0.7">
    Created with PenAI
  </text>
</svg>`;

  const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
  return `data:image/svg+xml;base64,${base64Svg}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { orderId, content, subject, style = 'modern' }: InfographicRequest = await req.json();

    console.log(`Generating infographic for order ${orderId}`);
    console.log(`Content length: ${content.length}`);

    const keyPoints = extractKeyPoints(content);
    console.log(`Extracted ${keyPoints.length} key points:`, keyPoints);

    if (keyPoints.length === 0) {
      throw new Error("Could not extract key points from content");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    let infographicUrl: string;

    if (openaiApiKey) {
      const dallEResult = await generateInfographicWithDallE(subject, keyPoints, style, openaiApiKey);
      if (dallEResult) {
        infographicUrl = dallEResult;
        console.log("Using DALL-E generated infographic");
      } else {
        infographicUrl = generateInfographicSVG(subject, keyPoints, style);
        console.log("Using SVG fallback infographic");
      }
    } else {
      infographicUrl = generateInfographicSVG(subject, keyPoints, style);
      console.log("No OpenAI API key, using SVG infographic");
    }

    return new Response(
      JSON.stringify({
        success: true,
        infographicUrl,
        keyPoints
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-infographic function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate infographic"
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