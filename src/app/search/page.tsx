import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import SearchClient from './SearchClient';
import { groupCategories, CategoryStats } from '@/lib/categories';

// Map ISO code to country name
function mapIsoToCountry(code?: string): string | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  if (upper === 'DE') return 'Germany';
  if (upper === 'NL') return 'Netherlands';
  return undefined;
}

// Country name to ISO code mapping for database queries
const COUNTRY_ISO_MAP: Record<string, string> = {
  'Netherlands': 'NL',
  'Germany': 'DE',
};

export const metadata: Metadata = {
  title: 'Search Products | VMDb',
  description: 'Search and filter plant-based meat alternatives on VMDb.',
};

// Fetch all published products with ratings from comments
async function getProducts(country?: string) {
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('products')
    .select(`
      product_id,
      product_name,
      product_image_url,
      brand,
      category,
      slug,
      is_vegan,
      store_name,
      country
    `)
    .in('product_status', ['publish', 'published']);

  // Apply country filter if specified (not World/EU)
  if (country && country !== 'World') {
    const isoCode = COUNTRY_ISO_MAP[country];
    if (isoCode) {
      // Query for EITHER full name OR ISO code to handle both storage formats
      query = query.or(`country.eq.${country},country.eq.${isoCode}`);
    } else {
      query = query.eq('country', country);
    }
  }

  // Execute query
  const { data: products, error } = await query.order('product_name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  if (!products || products.length === 0) {
    return [];
  }

  // Fetch ratings from comments in batch
  const productIds = products.map(p => p.product_id);
  const { data: comments } = await supabase
    .from('comments')
    .select('product_id, overall_rating')
    .in('product_id', productIds)
    .eq('is_approved', 1);

  // Calculate average ratings per product
  const ratingsMap = new Map<number, number>();
  if (comments) {
    const ratingsByProduct = new Map<number, number[]>();
    comments.forEach(c => {
      if (c.overall_rating != null && c.overall_rating > 0) {
        const existing = ratingsByProduct.get(c.product_id) || [];
        existing.push(c.overall_rating);
        ratingsByProduct.set(c.product_id, existing);
      }
    });
    ratingsByProduct.forEach((ratings, productId) => {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      ratingsMap.set(productId, avg);
    });
  }

  // Transform to match expected format
  return products.map(p => ({
    id: p.product_id,
    name: p.product_name,
    image: p.product_image_url,
    brand: p.brand,
    category: p.category,
    slug: p.slug,
    vegan: p.is_vegan,
    storeOfPurchase: p.store_name,
    rating: ratingsMap.get(p.product_id) || 0,
  }));
}

// Fetch category counts with localization
async function getCategoryStats(country?: string): Promise<CategoryStats[]> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('category')
    .in('product_status', ['publish', 'published']);

  // Apply country filter if specified (not World/EU)
  if (country && country !== 'World') {
    const isoCode = COUNTRY_ISO_MAP[country];
    if (isoCode) {
      query = query.or(`country.eq.${country},country.eq.${isoCode}`);
    } else {
      query = query.eq('country', country);
    }
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // Count products per category
  const categoryCounts = new Map<string, number>();
  data.forEach(p => {
    if (p.category) {
      const category = p.category.trim();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  });

  return groupCategories(categoryCounts, country);
}

export default async function SearchPage() {
  // Read country from cookie for localization
  const cookieStore = await cookies();
  const countryCookie = cookieStore.get('vmdb_country');
  const country = mapIsoToCountry(countryCookie?.value);

  const [products, categoryStats] = await Promise.all([
    getProducts(country),
    getCategoryStats(country),
  ]);

  return (
    <main className="container mx-auto px-4 py-8">
      <SearchClient
        initialProducts={products}
        categoryStats={categoryStats}
      />
    </main>
  );
}
