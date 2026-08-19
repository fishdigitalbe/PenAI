import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
}

export interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
}

export async function searchPexelsImages(
  query: string,
  perPage: number = 1
): Promise<string[]> {
  const pexelsApiKey = import.meta.env.VITE_PEXELS_API_KEY;

  if (!pexelsApiKey) {
    console.warn('Pexels API key not configured, using fallback images');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': pexelsApiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return [];
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos.map(photo => photo.src.large);
  } catch (error) {
    console.error('Error fetching Pexels images:', error);
    return [];
  }
}

export async function getCoverImage(subject: string): Promise<string | undefined> {
  const images = await searchPexelsImages(subject, 1);
  return images[0];
}

export async function getChapterImages(
  chapters: Array<{title: string}>,
  subject: string
): Promise<string[]> {
  const images: string[] = [];

  for (const chapter of chapters) {
    const query = `${subject} ${chapter.title}`;
    const chapterImages = await searchPexelsImages(query, 1);
    if (chapterImages.length > 0) {
      images.push(chapterImages[0]);
    } else {
      const fallbackImages = await searchPexelsImages(subject, 1);
      images.push(fallbackImages[0] || '');
    }
  }

  return images;
}

export async function searchPexelsPhotos(
  query: string,
  perPage: number = 15
): Promise<PexelsPhoto[]> {
  try {
    const supabaseUrl = SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/search-pexels?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels search error:', response.status);
      return [];
    }

    const data: PexelsSearchResponse = await response.json();
    return data.photos;
  } catch (error) {
    console.error('Error fetching Pexels photos:', error);
    return [];
  }
}
