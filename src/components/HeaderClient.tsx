"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogIn, LogOut, User as UserIcon, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCountry } from "@/hooks/use-country";
import { useAdmin } from "@/hooks/use-admin";
import CountryFlag from "@/components/CountryFlag";
import { toast } from "sonner";

type DialogType = "help" | "about" | "feedback" | null;

export default function HeaderClient() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Country selection
  const { activeCountryCode, activeCountryName, justDetected, setCountryOverride, clearCountryOverride } = useCountry();
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);

  // Track if initial session check is done (to avoid showing welcome toast on page load)
  const initialSessionCheckedRef = useRef(false);
  // Use sessionStorage to persist welcome toast state across tab switches (but reset on browser close)
  const hasShownWelcomeRef = useRef(false);

  // Check sessionStorage on mount (can't do this in useRef initializer due to SSR)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('vmdb_welcome_shown') === 'true') {
        hasShownWelcomeRef.current = true;
      }
    } catch {}
  }, []);
  const [availableCountries] = useState<string[]>(['Germany', 'Netherlands']);
  const [countryDraft, setCountryDraft] = useState<string>(activeCountryName || '');

  // Admin state
  const { isAdmin } = useAdmin();

  // Handle scroll for smooth progressive header shrink
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const maxScroll = 200;
          const progress = Math.min(scrollPosition / maxScroll, 1);
          const roundedProgress = Math.round(progress * 100) / 100;
          setScrollProgress(roundedProgress);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        supabase
          .from("profiles")
          .select("username, name")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setUsername(data?.name || data?.username || null);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from("profiles")
          .select("username, name")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setUsername(data?.name || data?.username || null);
          });

        // Show welcome toast on sign-in (but not on initial page load or tab switch)
        if (event === 'SIGNED_IN' && initialSessionCheckedRef.current && !hasShownWelcomeRef.current) {
          hasShownWelcomeRef.current = true;
          // Persist in sessionStorage so it survives tab switches but resets on browser close
          try { sessionStorage.setItem('vmdb_welcome_shown', 'true'); } catch {}

          // Check if this is a returning user (had reviews before)
          supabase
            .from('comments')
            .select('comment_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .then(({ data: existingReviews }) => {
              if (existingReviews && existingReviews.length > 0) {
                toast.success('Welcome back to VMDb! Continue discovering plant-based alternatives.');
              } else {
                toast.success('Welcome to VMDb! Start rating and help others discover tastier, greener choices!');
              }
            });
        }
      } else {
        setUsername(null);
        // Reset welcome toast flag on sign out
        hasShownWelcomeRef.current = false;
        try { sessionStorage.removeItem('vmdb_welcome_shown'); } catch {}
      }

      // Mark initial session check as done
      if (!initialSessionCheckedRef.current) {
        initialSessionCheckedRef.current = true;
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Show auto-detection toast once per session
  useEffect(() => {
    if (justDetected) {
      const label = activeCountryName || 'World';
      // Make message clearer about what location detection means
      const message = activeCountryName
        ? `Filtering products available in ${label}. You can change this anytime.`
        : `Showing all products worldwide. Select a country to filter by availability.`;
      toast.message(message, {
        position: 'top-center',
        action: {
          label: activeCountryName ? 'Change' : 'Select Country',
          onClick: () => setCountryDialogOpen(true),
        },
      });
    }
  }, [justDetected, activeCountryName]);

  // Helper function to interpolate between two values
  const lerp = (start: number, end: number, progress: number) => {
    return start + (end - start) * progress;
  };

  // Calculate sizes based on scroll progress
  const headerHeight = lerp(80, 56, scrollProgress);
  const logoHeight = lerp(56, 32, scrollProgress);
  const countryButtonHeight = lerp(36, 24, scrollProgress);
  const countryFlagHeight = lerp(16, 12, scrollProgress);
  const countryFlagWidth = lerp(24, 18, scrollProgress);
  const countryTextSize = lerp(14, 12, scrollProgress);
  const menuButtonSize = lerp(48, 32, scrollProgress);
  const menuIconSize = lerp(28, 20, scrollProgress);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const dialogContent: Record<
    Exclude<DialogType, null>,
    { title: string; description: string; content: React.ReactNode }
  > = {
    help: {
      title: "Get Involved",
      description: "Ways to contribute to VMDb",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            We run VMDb in our spare time, so your support means a lot. You can
            contribute in many ways:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Rate products you've tried</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Add new plant-based products that aren't listed yet</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Share VMDb with friends and family so we can grow the database
                together
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Send feedback or ideas anytime at{" "}
                <a
                  href="mailto:vmdb.me@gmail.com"
                  className="text-primary hover:underline"
                >
                  vmdb.me@gmail.com
                </a>
              </span>
            </li>
          </ul>
          <p className="text-sm leading-relaxed pt-2">
            Thanks for helping us build a better plant-based community!
          </p>
        </div>
      ),
    },
    about: {
      title: "About VMDb",
      description: "Learn about the founder and mission of VMDb",
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src="/about-image.jpg"
              alt="Lourens van der Zee"
              className="w-24 h-24 rounded-full object-cover"
              loading="lazy"
            />
          </div>
          <p className="text-sm leading-relaxed">
            Hi, I'm <strong>Lourens van der Zee</strong>, the founder of VMDb —
            the Vegan Meat Database.
          </p>
          <p className="text-sm leading-relaxed">
            A few years ago, after traveling through Southeast Asia and
            witnessing firsthand how deeply our planet is affected by pollution
            and consumption habits, I decided to make a change. I switched to a
            vegetarian diet, and later almost entirely vegan. But like many
            others, I still missed the taste and texture of good meat.
          </p>
          <p className="text-sm leading-relaxed">
            What I discovered was a fast-growing market full of innovation — yet
            also confusion. There were countless plant-based products, but no
            clear way to tell which ones truly delivered on taste, texture, and
            sustainability. That's why I started VMDb: a trustworthy,
            independent platform where people can share honest reviews of
            plant-based meat alternatives — just like IMDb does for movies.
          </p>
          <p className="text-sm leading-relaxed">
            VMDb isn't about preaching or perfection. It's about making
            plant-based choices easier and more enjoyable, and helping great
            products stand out for what they really offer.
          </p>
          <p className="text-sm leading-relaxed">
            Today, VMDb is being rebuilt with a stronger foundation: one that involves consumers, brands, and partners working together transparently to accelerate the shift toward a more sustainable food system.
          </p>
          <p className="text-sm leading-relaxed">
            If you share that vision — as a brand, a professional, or a curious
            eater — I'd love to connect.
          </p>
          <div className="text-sm space-y-1 pt-2">
            <p>
              Email:{" "}
              <a
                href="mailto:vmdb.me@gmail.com"
                className="text-primary hover:underline"
              >
                vmdb.me@gmail.com
              </a>
            </p>
            <p>
              LinkedIn:{" "}
              <a
                href="https://www.linkedin.com/in/lourensvanderzee/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Lourens van der Zee
              </a>
            </p>
          </div>
          <p className="text-sm text-muted-foreground italic pt-2">
            Thank you for being part of this journey toward a better, tastier,
            and more sustainable future.
          </p>
        </div>
      ),
    },
    feedback: {
      title: "Feedback",
      description: "Share your feedback and ideas with us",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            We are very interested to hear your feedback. Do you have ideas to
            improve the platform? New features? Or general feedback?
          </p>
          <p className="text-sm leading-relaxed">
            Please send us a message at{" "}
            <a
              href="mailto:vmdb.me@gmail.com"
              className="text-primary hover:underline font-medium"
            >
              vmdb.me@gmail.com
            </a>
            .
          </p>
          <p className="text-sm leading-relaxed">
            Looking forward to hearing from you!
          </p>
        </div>
      ),
    },
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background border-b">
        <div
          className="container mx-auto flex items-center justify-between px-4 transition-all duration-300 ease-out"
          style={{ height: `${headerHeight}px` }}
        >
          <Link href="/" className="flex items-center group">
            <img
              src="/vmdb-logo.jpg"
              alt="VMDb - The Vegan Meat Database"
              className="w-auto group-hover:opacity-80 transition-all duration-300 ease-out"
              style={{ height: `${logoHeight}px` }}
            />
          </Link>

          <div className="flex items-center gap-3">
            {/* Country Selector */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCountryDialogOpen(true)}
              className="px-0 sm:px-3 sm:border sm:border-input sm:bg-background sm:hover:bg-accent sm:hover:text-accent-foreground text-xs flex items-center gap-1 transition-all duration-300 ease-out"
              style={{ height: `${countryButtonHeight}px` }}
            >
              <CountryFlag
                code={activeCountryCode}
                className="transition-all duration-300 ease-out"
                style={{ height: `${countryFlagHeight}px`, width: `${countryFlagWidth}px` }}
              />
              <span
                className="hidden sm:inline transition-all duration-300 ease-out"
                style={{ fontSize: `${countryTextSize}px` }}
              >
                {activeCountryName || 'World'}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-all duration-300 ease-out"
                  style={{
                    height: `${menuButtonSize}px`,
                    width: `${menuButtonSize}px`,
                  }}
                >
                  <Menu
                    className="transition-all duration-300 ease-out"
                    style={{
                      height: `${menuIconSize}px`,
                      width: `${menuIconSize}px`,
                    }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-background"
                sideOffset={8}
              >
                {!loading && user ? (
                  <>
                    <div className="px-2 py-1.5 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        <span className="truncate">
                          {username || user.email}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : !loading ? (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/login")}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login / Sign Up
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={() => setOpenDialog("help")}>
                  Get Involved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDialog("about")}>
                  About
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDialog("feedback")}>
                  Feedback
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="http://localhost:5173/admin" target="_blank" rel="noopener noreferrer">
                        <Wrench className="mr-2 h-4 w-4" />
                        Admin
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main dialogs */}
      <Dialog open={openDialog !== null} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent
          className={
            openDialog === "about"
              ? "sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
              : "sm:max-w-[425px]"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {openDialog && dialogContent[openDialog].title}
            </DialogTitle>
            <DialogDescription>
              {openDialog && dialogContent[openDialog].description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {openDialog && dialogContent[openDialog].content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Country override dialog */}
      <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select your country</DialogTitle>
            <DialogDescription>
              Filter products by country availability
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CountryFlag code={activeCountryCode} className="h-4 w-6" />
              <span>Current: {activeCountryName || 'World'}</span>
            </div>
            <div className="text-xs text-muted-foreground">Select a country to filter products. "World" shows everything. Reset returns to auto-detect.</div>
            <Select value={countryDraft} onValueChange={setCountryDraft}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="World" value="World">
                  <span className="flex items-center gap-2"><CountryFlag code="WORLD" className="h-4 w-6" /> World (All)</span>
                </SelectItem>
                {availableCountries.map((c) => {
                  const reverse: Record<string,string> = {
                    'Germany':'DE','Netherlands':'NL','France':'FR','Belgium':'BE','Spain':'ES','Italy':'IT','United Kingdom':'GB','United States':'US','Canada':'CA','Australia':'AU'
                  };
                  const code = reverse[c] || c;
                  return (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2"><CountryFlag code={code} className="h-4 w-6" /> {c}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="flex justify-between gap-2">
              <Button variant="link" className="px-0" onClick={() => {
                clearCountryOverride();
                setCountryDialogOpen(false);
                toast.success('Country preference reset. Detecting your location...', { position: 'top-center' });
                setTimeout(() => window.location.reload(), 500);
              }}>Reset</Button>
              <Button variant="outline" onClick={() => setCountryDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { if (countryDraft) {
                const prev = activeCountryCode?.toUpperCase();
                const reverse: Record<string,string> = {
                  'Germany':'DE','Netherlands':'NL','France':'FR','Belgium':'BE','Spain':'ES','Italy':'IT','United Kingdom':'GB','United States':'US','Canada':'CA','Australia':'AU'
                };
                const iso = countryDraft === 'World' ? 'WORLD' : (reverse[countryDraft] || countryDraft);
                const upperIso = iso.toUpperCase();
                setCountryOverride(upperIso);
                setCountryDialogOpen(false);
                // Force full page reload if changed to ensure product lists refetch
                if (prev !== upperIso) {
                  setTimeout(() => window.location.reload(), 75);
                }
              } }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
