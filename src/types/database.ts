// TypeScript types for Supabase database tables

/**
 * Product from Supabase database (NEW CLEAN STRUCTURE)
 */
export interface SupabaseProduct {
  product_id: number;
  product_name: string;
  product_status: string;
  brand: string;
  category: string;
  country: string | null;
  barcode: string | null;
  weight_grams: number | null;
  store_name: string | null;
  store_url: string | null;
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_palm_oil_free: boolean | null;
  nutri_score: string | null;
  description: string | null;
  short_description: string | null;
  p_description: string | null;
  nutrition_facts: string | null;
  allergens: string | null;
  // Individual nutrition values (per 100g)
  energy_kj: number | null;
  energy_kcal: number | null;
  fat: number | null;
  saturated_fat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  protein: number | null;
  salt: number | null;
  overall_rating: number | null;
  taste_rating: number | null;
  meat_similarity_rating: number | null;
  value_rating: number | null;
  texture_rating: number | null;
  product_image_url: string | null;
  producer_url: string | null;
  last_reviewed_date?: string | null; // New: date of last approved change
  created_date: string;
  published_date: string;
  slug: string; // SEO-friendly URL slug
}

/**
 * Comment from Supabase database (NEW CLEAN STRUCTURE)
 */
export interface SupabaseComment {
  comment_id: number;
  product_id: number;
  author_name: string;
  display_name: string | null; // Original name entered by reviewer, preserved after account creation
  author_email: string | null;
  comment_date: string;
  comment_text: string;
  is_approved: number;
  overall_rating: number | null;
  taste_rating: number | null;
  meat_similarity_rating: number | null;
  value_rating: number | null;
  texture_rating: number | null;
  findability_rating: number | null;
  store_rating: number | null;
}

/**
 * Simplified Product interface for the app
 * This is what we'll use in components (cleaner than database columns)
 */
export interface Product {
  id: number;
  name: string;
  brand: string;
  rating: number;
  image: string;
  description: string;
  category: string;
  price?: number;
  // Additional fields from database
  weight: number;
  vegan: boolean;
  vegetarian: boolean;
  palmOilFree: boolean;
  nutriScore: string;
  ingredients: string;
  nutritionFacts: string;
  allergens?: string;
  // Individual nutrition values (per 100g)
  energy_kj?: number;
  energy_kcal?: number;
  fat?: number;
  saturated_fat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
  storeOfPurchase: string;
  storeLink: string;
  country: string;
  barcode: string;
  producer_product_url?: string;
  lastReviewed?: string; // ISO date (YYYY-MM-DD) of last approved change
  // Sub-ratings (calculated averages from reviews)
  tasteRating?: number | null;
  textureRating?: number | null;
  valueRating?: number | null;
  meatSimilarityRating?: number | null;
  slug?: string; // SEO-friendly URL slug
}

/**
 * Simplified Comment interface for the app
 */
export interface Comment {
  id: number;
  productId: number;
  author: string;
  authorAvatar?: string | null;
  authorName?: string | null;
  displayName?: string | null; // Original name entered by reviewer, preserved after account creation
  content: string;
  rating: number;
  createdAt: string;
  approved: boolean;
}

/**
 * Pending rating from Supabase database
 * Used for storing ratings from unauthenticated users before account creation
 */
export interface PendingRating {
  id: string;
  email: string;
  product_id: number;
  product_name: string;
  rating: number;
  review_content: string;
  taste_rating: number | null;
  texture_rating: number | null;
  value_rating: number | null;
  meat_similarity_rating: number | null;
  created_at: string;
  expires_at: string;
  claimed: boolean;
  claimed_at: string | null;
  claimed_by_user_id: string | null;
}

/**
 * User-submitted product from Supabase database
 * Used for storing user-submitted products awaiting admin review
 */
export interface UserSubmittedProduct {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_by: string;
  submitted_email: string | null;
  search_query: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Extracted product data
  product_name: string | null;
  brand: string | null;
  barcode: string | null;
  ingredients: string | null;
  nutrition_facts: Record<string, number | null> | null;
  weight: string | null;
  category: string | null;
  allergens: string | null;
  is_vegan: boolean | null;
  is_vegetarian: boolean | null;
  // Image and metadata
  image_urls: string[];
  confidence_scores: Record<string, number>;
  raw_extraction: Record<string, any> | null;
  admin_notes: string | null;
  approved_product_id: number | null;
  created_at: string;
  updated_at: string;
}
