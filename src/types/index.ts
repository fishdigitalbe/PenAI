export interface GenerationParams {
  targetAudience: string;
  subject: string;
  wordCount: number;
  toneOfVoice: string;
  language: string;
  contentType: 'ebook' | 'blog';
  contentGoal: 'problem-aware' | 'solution-aware' | 'product-aware';
  productUrl?: string;
  websiteUrl?: string;
  includeVisuals: boolean;
  imageStyle?: 'pen-drawing' | 'geometric' | 'watercolor' | 'minimalist' | 'photorealistic';
  createSocialAssets: boolean;
}

export interface GenerationResult {
  content: string;
  title: string;
  chapters: Chapter[];
  wordCount: number;
  generatedAt: string;
  metadata?: {
    description?: string;
    keywords?: string[];
    author?: string;
    organization?: string;
    jsonLd?: string;
  };
}

export interface ChapterImage {
  url: string;
  photographer: string;
  photographerUrl: string;
}

export interface Chapter {
  title: string;
  intro?: string;
  content: string;
  image?: ChapterImage;
  pexelsImage?: ChapterImage;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  vatNumber: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface CheckoutFormData extends CustomerDetails {
  generationParams: GenerationParams;
}
