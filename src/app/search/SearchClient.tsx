"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Leaf, ArrowUpDown, ArrowLeft, Camera, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  brand: string;
  rating: number;
  image: string;
  category?: string;
  vegan?: boolean;
  slug?: string;
  storeOfPurchase?: string;
}

interface CategoryStat {
  category: string;
  displayName: string;
  count: number;
  subcategories: string[];
}

interface SearchClientProps {
  initialProducts: Product[];
  categoryStats: CategoryStat[];
}

export default function SearchClient({ initialProducts, categoryStats }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [veganOnly, setVeganOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "rating");

  // Extract unique stores from products
  const stores = useMemo(() => {
    const storeSet = new Set<string>();
    initialProducts.forEach(p => {
      if (p.storeOfPurchase) {
        p.storeOfPurchase.split(',').forEach(store => {
          storeSet.add(store.trim());
        });
      }
    });
    return Array.from(storeSet).sort();
  }, [initialProducts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = initialProducts.filter(p => p.id != null && !isNaN(Number(p.id)));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Apply vegan filter
    if (veganOnly) {
      filtered = filtered.filter(p => p.vegan);
    }

    // Apply category filter using subcategories from categoryStats (matches Vite behavior)
    if (selectedCategory !== "all") {
      const categoryGroup = categoryStats.find(cs => cs.category === selectedCategory);

      if (categoryGroup && categoryGroup.subcategories.length > 0) {
        // Filter by any of the subcategories in the group
        filtered = filtered.filter(p =>
          categoryGroup.subcategories.includes(p.category || '')
        );
      } else {
        // Fallback: direct match
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
    }

    // Apply store filter
    if (selectedStore !== "all") {
      filtered = filtered.filter(p =>
        p.storeOfPurchase && p.storeOfPurchase.split(',').map(s => s.trim()).includes(selectedStore)
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        sorted.sort((a, b) => Number(b.id) - Number(a.id));
        break;
    }

    return sorted;
  }, [initialProducts, searchQuery, veganOnly, selectedCategory, selectedStore, sortBy]);

  // Update URL when search changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (sortBy !== "rating") params.set("sort", sortBy);

      const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
      router.replace(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, sortBy, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearFilters = () => {
    setVeganOnly(false);
    setSelectedCategory("all");
    setSelectedStore("all");
  };

  const hasActiveFilters = veganOnly || selectedCategory !== "all" || selectedStore !== "all";

  return (
    <>
      {/* Back to Home Button */}
      <div className="mb-4 sm:mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mx-auto max-w-xl mb-4 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-input"
            name="q"
            type="text"
            placeholder="Search plant-based meat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-12 placeholder:text-xs sm:placeholder:text-sm placeholder:transition-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
          />
        </div>
      </form>

      {/* Filters and Sort */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          {/* Filter label - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Vegan Only Toggle */}
          <Button
            variant={veganOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setVeganOnly(!veganOnly)}
            className="text-xs sm:text-sm gap-1"
          >
            <Leaf className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">100% Vegan Only</span>
            <span className="sm:hidden">Vegan</span>
          </Button>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className={`w-[130px] sm:w-[180px] h-8 sm:h-10 text-xs sm:text-sm [&>span]:text-left [&>span]:truncate [&>span]:block ${selectedCategory !== "all" ? "border-primary bg-primary/10" : ""}`}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryStats.map(stat => (
                <SelectItem key={stat.category} value={stat.category}>
                  {stat.displayName} ({stat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Store Filter */}
          {stores.length > 0 && (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className={`w-[110px] sm:w-[180px] h-8 sm:h-10 text-xs sm:text-sm [&>span]:text-left [&>span]:truncate [&>span]:block ${selectedStore !== "all" ? "border-primary bg-primary/10" : ""}`}>
                <SelectValue placeholder="Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {veganOnly && (
              <Badge variant="secondary" className="gap-1">
                Vegan Only
                <button onClick={() => setVeganOnly(false)} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {categoryStats.find(s => s.category === selectedCategory)?.displayName || selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            {selectedStore !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedStore}
                <button onClick={() => setSelectedStore("all")} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results Count with Sort */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-4 mb-1 sm:mb-2">
          <h2 className="text-xl sm:text-2xl font-bold">
            {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
          </h2>

          {/* Sort Options */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Sort:</span>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground sm:hidden" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[100px] sm:w-[160px] h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              brand={product.brand}
              rating={product.rating}
              image={product.image}
              category={product.category}
              vegan={product.vegan}
              slug={product.slug}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-6">
          <div>
            <p className="text-lg font-semibold mb-2">No products found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}"`
                : "No products match your current filters"}
            </p>
          </div>

          {/* Help us add it CTA */}
          {searchQuery && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3 max-w-md mx-auto">
              <Camera className="h-12 w-12 mx-auto text-primary" />
              <div>
                <p className="font-semibold text-lg mb-1">
                  Couldn't find this product?
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Help us add it to VMDb! Send us the product details and we'll add it to our database.
                </p>
              </div>
              <a
                href={`mailto:vmdb.me@gmail.com?subject=New Product Suggestion: ${encodeURIComponent(searchQuery)}&body=Hi VMDb team,%0A%0AI'd like to suggest adding this product:%0A%0AProduct name: ${encodeURIComponent(searchQuery)}%0ABrand: %0AStore where I found it: %0A%0AThanks!`}
              >
                <Button size="lg" className="gap-2">
                  <Mail className="h-5 w-5" />
                  Suggest this product
                </Button>
              </a>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Try adjusting your search:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              {searchQuery && <li>Check your spelling or try different keywords</li>}
              {hasActiveFilters && (
                <li>Remove some filters to see more results</li>
              )}
              <li>Browse all products by clearing your search</li>
              <li>Try searching for a specific brand or category</li>
            </ul>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          )}

          {/* Show some suggested products when search returns no results */}
          {searchQuery && initialProducts.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm font-medium mb-4">You might be interested in:</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {initialProducts.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    brand={product.brand}
                    rating={product.rating}
                    image={product.image}
                    category={product.category}
                    vegan={product.vegan}
                    slug={product.slug}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
