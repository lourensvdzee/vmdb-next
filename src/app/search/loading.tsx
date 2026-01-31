import { Loader2 } from 'lucide-react';

export default function SearchLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-xl mb-8">
        <div className="h-12 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading products...</span>
      </div>
    </main>
  );
}
