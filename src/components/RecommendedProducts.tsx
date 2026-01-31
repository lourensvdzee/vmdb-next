"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Product {
  id: number;
  name: string;
  brand: string;
  image_url: string | null;
  category: string;
  avg_rating?: number;
  slug?: string;
}

interface RecommendedProductsProps {
  currentProductId: number;
  currentProductCategory: string;
}

// Map categories to their main groups
function getMainCategoryGroup(category: string): string {
  const lowerCategory = category.toLowerCase().trim();

  const groupingRules: Record<string, string[]> = {
    'BURGER': ['burger'],
    'SAUSAGES': ['wurst', 'bratwurst', 'leberwurst', 'sausage', 'worst', 'hotdog'],
    'NUGGETS': ['nugget', 'bites'],
    'CHICKEN': ['kip', 'kipfilet', 'kipschnitzel', 'chicken', 'döner', 'doner', 'gyros', 'kebab'],
    'MINCE': ['mince', 'gehakt'],
    'SCHNITZEL': ['schnitzel', 'cordon bleu'],
    'STRIPS': ['strips', 'reepjes', 'stroken'],
    'MEATBALLS': ['hackbällchen', 'gemüsebällchen', 'falafel', 'frikadelle', 'meatball', 'gehaktbal', 'bal'],
    'DELI': ['brotbelag', 'cold cut', 'opsnij', 'vleeswaren', 'lachsschinken', 'lachschinken', 'lachs'],
    'BACON': ['bacon', 'spek', 'spekjes', 'speck'],
    'BEEF': ['rind', 'rindfleisch', 'hackfleisch', 'steak', 'biefstuk'],
    'FILET': ['filet', 'fillet'],
    'FISH': ['fisch', 'fischstäbchen', 'fish', 'vis', 'zalm', 'tuna', 'tonijn'],
    'TOFU': ['tofu', 'tempeh'],
  };

  for (const [mainCategory, keywords] of Object.entries(groupingRules)) {
    if (keywords.some(keyword => lowerCategory.includes(keyword))) {
      return mainCategory;
    }
  }

  return category.toUpperCase();
}

function getSubcategoriesForMainGroup(mainGroup: string): string[] {
  const groupingRules: Record<string, string[]> = {
    'BURGER': ['burger'],
    'SAUSAGES': ['wurst', 'bratwurst', 'leberwurst', 'sausage', 'worst', 'hotdog'],
    'NUGGETS': ['nugget', 'bites'],
    'CHICKEN': ['kip', 'kipfilet', 'kipschnitzel', 'chicken', 'döner', 'doner', 'gyros', 'kebab'],
    'MINCE': ['mince', 'gehakt'],
    'SCHNITZEL': ['schnitzel', 'cordon bleu'],
    'STRIPS': ['strips', 'reepjes', 'stroken'],
    'MEATBALLS': ['hackbällchen', 'gemüsebällchen', 'falafel', 'frikadelle', 'meatball', 'gehaktbal', 'bal'],
    'DELI': ['brotbelag', 'cold cut', 'opsnij', 'vleeswaren', 'lachsschinken', 'lachschinken', 'lachs'],
    'BACON': ['bacon', 'spek', 'spekjes', 'speck'],
    'BEEF': ['rind', 'rindfleisch', 'hackfleisch', 'steak', 'biefstuk'],
    'FILET': ['filet', 'fillet'],
    'FISH': ['fisch', 'fischstäbchen', 'fish', 'vis', 'zalm', 'tuna', 'tonijn'],
    'TOFU': ['tofu', 'tempeh'],
  };

  return groupingRules[mainGroup] || [];
}

const RecommendedProducts = ({ currentProductId, currentProductCategory }: RecommendedProductsProps) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      setIsLoading(true);

      const mainCategoryGroup = getMainCategoryGroup(currentProductCategory);
      const subcategoryKeywords = getSubcategoriesForMainGroup(mainCategoryGroup);

      const { data: allProducts, error } = await supabase
        .from("products")
        .select("product_id, product_name, brand, product_image_url, category, slug")
        .eq('product_status', 'publish')
        .neq('product_id', currentProductId)
        .limit(50);

      if (error || !allProducts) {
        setIsLoading(false);
        return;
      }

      // Get ratings for these products
      const productIds = allProducts.map(p => p.product_id);
      const { data: comments } = await supabase
        .from("comments")
        .select("product_id, overall_rating")
        .in('product_id', productIds)
        .eq('is_approved', 1);

      // Calculate average ratings
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
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          ratingsMap.set(productId, avg);
        });
      }

      // Map and filter products
      const productsWithRatings = allProducts.map(product => {
        const productCategory = product.category?.toLowerCase() || '';
        const isSameMainCategory = subcategoryKeywords.some(keyword =>
          productCategory.includes(keyword)
        );

        return {
          id: product.product_id,
          name: product.product_name,
          brand: product.brand,
          image_url: product.product_image_url,
          category: product.category,
          avg_rating: ratingsMap.get(product.product_id) || 0,
          slug: product.slug,
          isSameMainCategory,
        };
      });

      // Sort and prioritize same category
      const sameCategoryProducts = productsWithRatings
        .filter(p => p.isSameMainCategory)
        .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

      const otherCategoryProducts = productsWithRatings
        .filter(p => !p.isSameMainCategory)
        .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));

      // Build result: first 3 from same category, then fill with best rated
      const result: Product[] = [];
      result.push(...sameCategoryProducts.slice(0, 3));

      const remaining = [...sameCategoryProducts.slice(3), ...otherCategoryProducts]
        .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
        .slice(0, 8 - result.length);

      result.push(...remaining);

      setRecommendedProducts(result.slice(0, 8));
      setIsLoading(false);
    };

    fetchRecommendedProducts();
  }, [currentProductId, currentProductCategory, supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>You might also like</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex shadow-lg"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div
            ref={scrollContainerRef}
            className="overflow-x-auto flex gap-3 pb-2 scroll-smooth"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/product/${product.id}${product.slug ? `/${product.slug}` : ''}`)}
              >
                <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
                {product.avg_rating ? (
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(product.avg_rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium ml-1">{product.avg_rating.toFixed(1)} / 5</span>
                  </div>
                ) : (
                  <div className="h-5 mt-1" />
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity md:flex shadow-lg"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendedProducts;
