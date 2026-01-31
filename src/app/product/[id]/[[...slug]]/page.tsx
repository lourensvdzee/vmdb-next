import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductPageClient from '@/components/ProductPageClient';

// Fetch product by ID
async function getProduct(id: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', id)
    .eq('product_status', 'publish')
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

// Fetch comments for a product with sub-ratings
async function getComments(productId: string) {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', 1)
    .order('comment_date', { ascending: false });

  return comments || [];
}

// Generate SEO metadata with ratings
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; slug?: string[] }>
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | VMDb',
    };
  }

  // Fetch comments for rating in metadata
  const supabase = await createClient();
  const { data: comments } = await supabase
    .from('comments')
    .select('overall_rating')
    .eq('product_id', id)
    .eq('is_approved', 1);

  // Calculate average rating
  let ratingText = '';
  if (comments && comments.length > 0) {
    const avgRating = comments.reduce((sum, c) => sum + (c.overall_rating || 0), 0) / comments.length;
    ratingText = ` - Rated ${avgRating.toFixed(1)}/5 by ${comments.length} ${comments.length === 1 ? 'reviewer' : 'reviewers'}`;
  }

  // Build description with product info and rating
  const baseDescription = product.short_description
    || product.description
    || `Plant-based ${product.category || 'meat alternative'} from ${product.brand}`;

  const metaDescription = `${baseDescription.length > 100 ? baseDescription.substring(0, 97) + '...' : baseDescription}${ratingText}`;

  // Enhanced title with brand - format: "Product Name from Brand"
  const title = `${product.product_name} from ${product.brand}`;
  const ogTitle = `${product.product_name} from ${product.brand} - Plant-based meat`;

  const productUrl = `https://vmdb.me/product/${product.product_id}${product.slug ? `/${product.slug}` : ''}`;
  const imageUrl = product.product_image_url || 'https://vmdb.me/logo.png';

  // Social sharing description - more engaging
  const socialDescription = ratingText
    ? `See our community's rating for ${product.product_name} from ${product.brand}${ratingText}. Discover plant-based meat alternatives on VMDb.`
    : `Discover ${product.product_name} from ${product.brand}. Read reviews and ratings for this plant-based meat alternative on VMDb.`;

  return {
    title: `${title} | VMDb`,
    description: metaDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: 'website',
      title: ogTitle,
      description: socialDescription,
      url: productUrl,
      siteName: 'VMDb - Plant-Based Meat Database',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${product.product_name} by ${product.brand}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: socialDescription,
      images: [imageUrl],
    },
  };
}

// Generate Schema.org structured data
function generateProductSchema(product: any, comments: any[]) {
  const productUrl = `https://vmdb.me/product/${product.product_id}${product.slug ? `/${product.slug}` : ''}`;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.product_name,
    "image": product.product_image_url || "https://vmdb.me/logo.png",
    "description": product.short_description || product.description || `${product.product_name} by ${product.brand}`,
    "url": productUrl,
    "brand": {
      "@type": "Brand",
      "name": product.brand,
    },
    "category": product.category,
  };

  if (comments.length > 0) {
    const avgRating = comments.reduce((sum, c) => sum + (c.overall_rating || 0), 0) / comments.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": comments.length,
      "bestRating": "5",
      "worstRating": "1",
    };
  }

  return schema;
}

// Calculate average sub-ratings from comments
function calculateSubRatings(comments: any[]) {
  const subRatings = {
    taste: [] as number[],
    texture: [] as number[],
    value: [] as number[],
    meatSimilarity: [] as number[],
  };

  comments.forEach(c => {
    if (c.taste_rating) subRatings.taste.push(c.taste_rating);
    if (c.texture_rating) subRatings.texture.push(c.texture_rating);
    if (c.value_rating) subRatings.value.push(c.value_rating);
    if (c.meat_similarity_rating) subRatings.meatSimilarity.push(c.meat_similarity_rating);
  });

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    tasteRating: avg(subRatings.taste),
    textureRating: avg(subRatings.texture),
    valueRating: avg(subRatings.value),
    meatSimilarityRating: avg(subRatings.meatSimilarity),
  };
}

// Page component
export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string; slug?: string[] }>
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const comments = await getComments(id);
  const productSchema = generateProductSchema(product, comments);
  const subRatings = calculateSubRatings(comments);

  // Calculate average rating
  const avgRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + (c.overall_rating || 0), 0) / comments.length).toFixed(1)
    : null;

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <ProductPageClient
        product={product}
        comments={comments}
        avgRating={avgRating}
        subRatings={subRatings}
      />
    </>
  );
}
