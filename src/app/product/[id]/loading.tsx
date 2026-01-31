import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProductLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6" />

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Image skeleton */}
        <div className="aspect-square bg-muted rounded-lg animate-pulse" />

        {/* Info skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-20 w-full bg-muted rounded animate-pulse" />
          <div className="h-12 w-40 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
