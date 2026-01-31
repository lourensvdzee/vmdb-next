'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Camera, ArrowLeft, Search, Upload } from 'lucide-react';
import UploadWizard from './UploadWizard';

export default function ProductNotFoundClient() {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The product you're looking for doesn't exist or may have been removed from our database.
      </p>

      {/* Help us add it CTA */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4 max-w-md mx-auto mb-8">
        <Camera className="h-12 w-12 mx-auto text-primary" />
        <div>
          <p className="font-semibold text-lg mb-1">
            Couldn't find this product?
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Help us add it to VMDb! Upload photos and we'll extract the info automatically.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setUploadOpen(true)}>
          <Upload className="h-5 w-5" />
          Help us add it!
        </Button>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Search Products
          </Button>
        </Link>
      </div>

      <UploadWizard open={uploadOpen} onOpenChange={setUploadOpen} />
    </main>
  );
}
