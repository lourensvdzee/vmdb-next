import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Base URL for the sitemap - update for production
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vmdb.me';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration for sitemap');
    return getStaticPages();
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Fetch published products
  const { data: products, error } = await supabase
    .from('products')
    .select('product_id, slug')
    .in('product_status', ['publish', 'published'])
    .order('product_id', { ascending: false })
    .limit(5000);

  if (error) {
    console.error('Error fetching products for sitemap:', error);
    return getStaticPages();
  }

  // Static pages
  const staticPages = getStaticPages();

  // Product pages
  const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
    url: product.slug
      ? `${BASE_URL}/product/${product.product_id}/${product.slug}`
      : `${BASE_URL}/product/${product.product_id}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}

function getStaticPages(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
