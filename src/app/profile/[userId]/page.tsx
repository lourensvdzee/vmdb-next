import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicProfileClient from './PublicProfileClient';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | VMDb',
    };
  }

  return {
    title: `${profile.username}'s Profile | VMDb`,
    description: `View ${profile.username}'s reviews and ratings on VMDb`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const supabase = await createClient();

  // Get profile data by user ID
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Get current user to check if viewing own profile
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  // If viewing own profile, redirect to /profile (the editable version)
  if (isOwnProfile) {
    const { redirect } = await import('next/navigation');
    redirect('/profile');
  }

  // Get user's reviews
  const { data: reviews } = await supabase
    .from('comments')
    .select('comment_id, product_id, overall_rating, comment_text, comment_date')
    .eq('user_id', userId)
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
      <PublicProfileClient
        profile={profile}
        reviews={reviewsWithProducts}
      />
    </main>
  );
}
