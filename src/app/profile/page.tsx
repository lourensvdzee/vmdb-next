import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'My Profile | VMDb',
  description: 'View and manage your VMDb profile',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's reviews
  const { data: reviews } = await supabase
    .from('comments')
    .select('comment_id, product_id, overall_rating, comment_text, comment_date')
    .eq('user_id', user.id)
    .eq('is_approved', 1)
    .order('comment_date', { ascending: false })
    .limit(10);

  // Get product details for reviews
  let reviewsWithProducts: any[] = [];
  if (reviews && reviews.length > 0) {
    const productIds = reviews.map(r => r.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('product_id, product_name, product_image_url, brand, slug')
      .in('product_id', productIds);

    const productsMap = new Map(products?.map(p => [p.product_id, p]) || []);

    reviewsWithProducts = reviews.map(review => ({
      ...review,
      product: productsMap.get(review.product_id) || null,
    }));
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileClient
        profile={profile}
        userEmail={user.email || ''}
        reviews={reviewsWithProducts}
      />
    </main>
  );
}
