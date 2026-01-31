"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function HomeHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative h-[500px] md:h-[700px] overflow-hidden">
      {/* Video Background - Desktop: scale down video and show more content */}
      {isDesktop ? (
        <div
          className="absolute"
          style={{
            transform: 'scale(0.65)',
            transformOrigin: 'center center',
            top: '-300px',
            bottom: '-200px',
            left: '-200px',
            right: '-200px',
            width: 'calc(100% + 400px)',
            height: 'calc(100% + 500px)',
            willChange: 'transform'
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center center',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <source src="/rotating-hamburger.webm" type="video/webm" />
          </video>
        </div>
      ) : (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          style={{
            objectPosition: 'center center',
            top: '-5%',
            left: '0'
          }}
        >
          <source src="/rotating-hamburger.webm" type="video/webm" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center justify-center pt-8 md:pt-6">
        <div className="mx-auto max-w-2xl text-center w-full flex flex-col items-center">
          {/* Logo */}
          <img
            src="/V-white.png"
            alt="VMDb Logo"
            className="h-12 w-auto md:h-16 mb-4"
          />

          {/* Stylized Title */}
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased]">
            <span style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'transparent', color: 'transparent' }}>V</span>
            EGA(N){' '}
            <span style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'transparent', color: 'transparent' }}>M</span>
            EAT{' '}
            <span style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'transparent', color: 'transparent' }}>D</span>
            ATA
            <span style={{ WebkitTextStroke: '1px white', WebkitTextFillColor: 'transparent', color: 'transparent' }}>b</span>
            ASE
          </h1>

          {/* Search */}
          <div className="w-full max-w-xl mb-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="homepage-search"
                name="q"
                type="text"
                placeholder="Search meat alternatives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-12 text-lg w-full"
                enterKeyHint="search"
              />

              {/* Barcode Scanner Icon - hides when typing */}
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 ${
                  searchQuery.trim().length > 0
                    ? "opacity-0 scale-95 pointer-events-none"
                    : "opacity-100 scale-100"
                }`}
                aria-label="Scan barcode"
              >
                <ScanLine className="h-6 w-6" />
              </button>

              {/* Search Button - appears when typing */}
              {searchQuery.trim().length > 0 && (
                <Button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-4 transition-all duration-300"
                  aria-label="Search"
                >
                  Search
                </Button>
              )}
            </form>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl font-semibold italic text-white tracking-wide max-w-3xl">
            Start rating, and help the community{" "}
            <br className="hidden md:block" />
            make better plant-based choices!
          </p>
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} />
    </section>
  );
}
