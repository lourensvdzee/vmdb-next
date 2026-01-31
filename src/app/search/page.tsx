import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Search Products | VMDb',
  description: 'Search and filter plant-based meat alternatives on VMDb.',
};

// Fetch all published products with ratings from comments
async function getProducts() {
  const supabase = await createClient();

  // Fetch products
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      product_id,
      product_name,
      product_image_url,
      brand,
      category,
      slug,
      is_vegan,
      store_name
    `)
    .eq('product_status', 'publish')
    .order('product_name', { ascending: true });

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

// Fetch category counts
async function getCategoryStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('product_status', 'publish');

  if (error || !data) {
    return [];
  }

  // Count products per category
  const counts: Record<string, number> = {};
  data.forEach(p => {
    if (p.category) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
  });

  // Convert to array sorted by count
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function SearchPage() {
  const [products, categoryStats] = await Promise.all([
    getProducts(),
    getCategoryStats(),
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
