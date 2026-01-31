import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to check if a Google image URL is valid and add necessary parameters
export function processGoogleImageUrl(url: string): string {
  if (url.startsWith('https://lh3.googleusercontent.com/')) {
    // Add parameters that might help with CORS and caching
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}imgrefurl=vmdb.com&imgformat=png`;
  }
  return url;
}

// Helper to log image load errors for debugging
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, url: string) {
  console.error('Image failed to load:', url);

  const target = e.currentTarget;
  // If this is already the fallback image, don't try to set it again
  if (!target.src.includes('unsplash.com')) {
    // Try to load the image directly first with modified parameters
    if (url.startsWith('https://lh3.googleusercontent.com/')) {
      const modifiedUrl = processGoogleImageUrl(url);
      if (modifiedUrl !== url) {
        target.src = modifiedUrl;
        return;
      }
    }
    // If that doesn't work, use the fallback
    target.src = 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&h=800&fit=crop';
  }
}
