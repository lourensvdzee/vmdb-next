import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import CategoryScroll from '@/components/CategoryScroll';
import HorizontalProductScroll from '@/components/HorizontalProductScroll';
import HorizontalReviewScroll from '@/components/HorizontalReviewScroll';
import AnimatedSubtitle from '@/components/AnimatedSubtitle';
import { groupCategories, CategoryStats } from '@/lib/categories';

// Map ISO code to country name
function mapIsoToCountry(code?: string): string | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  if (upper === 'DE') return 'Germany';
  if (upper === 'NL') return 'Netherlands';
  return undefined;
}

// Fetch top rated products with ratings (filtered by country if specified)
async function getTopProducts(country?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('product_id, product_name, product_image_url, brand, category, slug, is_vegan')
    .eq('product_status', 'publish');

  // Apply country filter if specified
  if (country) {
    // Map country name to ISO code for OR filter
    const isoMap: Record<string, string> = { 'Germany': 'DE', 'Netherlands': 'NL' };
    const isoCode = isoMap[country];
    if (isoCode) {
      query = query.or(`country.eq.${country},country.eq.${isoCode}`);
    } else {
      query = query.eq('country', country);
    }
  }

  const { data: products } = await query.limit(100);

  if (!products || products.length === 0) return [];

  const productIds = products.map(p => p.product_id);
  const { data: comments } = await supabase
    .from('comments')
    .select('product_id, overall_rating')
    .in('product_id', productIds)
    .eq('is_approved', 1);

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

  return products
    .map(p => ({
      id: p.product_id,
      name: p.product_name,
      image: p.product_image_url,
      brand: p.brand,
      category: p.category,
      slug: p.slug,
      vegan: p.is_vegan,
      rating: ratingsMap.get(p.product_id) || 0,
    }))
    .filter(p => p.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 12);
}

// Fetch grouped categories with counts (localized)
async function getCategories(country?: string): Promise<CategoryStats[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('product_status', 'publish');

  if (!data) return [];

  const categoryCounts = new Map<string, number>();
  data.forEach(p => {
    if (p.category) {
      const category = p.category.trim();
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  });

  return groupCategories(categoryCounts, country);
}

// Fetch latest reviews
async function getLatestReviews() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      comment_id,
      comment_text,
      overall_rating,
      comment_date,
      author_name,
      product_id,
      user_id
    `)
    .eq('is_approved', 1)
    .not('comment_text', 'is', null)
    .order('comment_date', { ascending: false })
    .limit(12);

  if (!comments || comments.length === 0) return [];

  const productIds = [...new Set(comments.map(c => c.product_id))];
  const { data: products } = await supabase
    .from('products')
    .select('product_id, product_name, product_image_url, brand, slug')
    .in('product_id', productIds);

  const productMap = new Map(products?.map(p => [p.product_id, p]) || []);

  const userIds = comments.map(c => c.user_id).filter(Boolean);
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds)
    : { data: [] };

  const profileMap = new Map<string, { id: string; avatar_url: string | null }>(
    profiles?.map(p => [p.id, p] as const) || []
  );

  return comments.map(comment => ({
    comment: {
      ...comment,
      authorAvatar: comment.user_id ? profileMap.get(comment.user_id)?.avatar_url || null : null
    },
    product: productMap.get(comment.product_id) || null,
  }));
}

export default async function HomePage() {
  // Read country from cookie for localization
  const cookieStore = await cookies();
  const countryCookie = cookieStore.get('vmdb_country');
  const country = mapIsoToCountry(countryCookie?.value);

  const [topProducts, categories, latestReviews] = await Promise.all([
    getTopProducts(country),
    getCategories(country),
    getLatestReviews(),
  ]);

  return (
    <main>
      {/* Hero Section with Video Background */}
      <HomeHero />

      {/* Category Stats - Browse by Category */}
      {categories.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <Link href="/search" className="block mb-6 hover:opacity-80 transition-opacity">
              <h2 className="text-3xl font-bold">Browse by Category</h2>
            </Link>
            <CategoryScroll categories={categories} />
          </div>
        </section>
      )}

      {/* Top Rated Products - Horizontal Scroll */}
      {topProducts.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <Link href="/search?sort=rating" className="block mb-6 hover:opacity-80 transition-opacity">
              <h2 className="text-3xl font-bold">Top Rated Products</h2>
            </Link>
            <HorizontalProductScroll products={topProducts} />
          </div>
        </section>
      )}

      {/* Latest Reviews */}
      {latestReviews.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <Link href="/search" className="block mb-6 hover:opacity-80 transition-opacity">
              <h2 className="text-3xl font-bold">Latest Reviews</h2>
            </Link>
            <HorizontalReviewScroll reviews={latestReviews} />
          </div>
        </section>
      )}

      {/* Animated Subtitle Carousel */}
      <div className="bg-primary py-8">
        <div className="container mx-auto px-4 flex justify-center">
          <AnimatedSubtitle />
        </div>
      </div>
    </main>
  );
}
