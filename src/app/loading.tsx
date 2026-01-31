import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
