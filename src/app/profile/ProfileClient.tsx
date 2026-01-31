"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Edit, Save, X, Star, LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  dietary_preference: string | null;
}

interface Review {
  comment_id: number;
  product_id: number;
  overall_rating: number;
  comment_text: string;
  comment_date: string;
  product: {
    product_id: number;
    product_name: string;
    product_image_url: string | null;
    brand: string;
    slug: string | null;
  } | null;
}

interface ProfileClientProps {
  profile: Profile | null;
  userEmail: string;
  reviews: Review[];
}

export default function ProfileClient({ profile, userEmail, reviews }: ProfileClientProps) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [username, setUsername] = useState(profile?.username || "");
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [country, setCountry] = useState(profile?.country || "");

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          name: name.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          country: country.trim() || null,
        })
        .eq("id", profile.id);

      if (error) {
        if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
          toast.error("This username is already taken");
        } else {
          toast.error(error.message || "Failed to update profile");
        }
        return;
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(profile?.username || "");
    setName(profile?.name || "");
    setBio(profile?.bio || "");
    setLocation(profile?.location || "");
    setCountry(profile?.country || "");
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return profile?.username?.slice(0, 2).toUpperCase() || "?";
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Profile not found. Please try logging out and back in.</p>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>
    );
  }

  return (
    <>
      {/* Header with avatar and actions */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
          <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.name || profile.username}</h1>
          {profile.name && <p className="text-muted-foreground">@{profile.username}</p>}
          <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
          {profile.location && profile.country && (
            <p className="text-sm text-muted-foreground mt-1">
              {profile.location}, {profile.country}
            </p>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {!isEditing ? (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
            <Label className="font-medium sm:text-right">Username</Label>
            {isEditing ? (
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.username}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
            <Label className="font-medium sm:text-right">Full Name</Label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.name || "Not set"}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <Label className="font-medium sm:text-right sm:pt-2">Bio</Label>
            {isEditing ? (
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.bio || "No bio yet"}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
            <Label className="font-medium sm:text-right">City</Label>
            {isEditing ? (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Amsterdam"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.location || "Not set"}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
            <Label className="font-medium sm:text-right">Country</Label>
            {isEditing ? (
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Netherlands"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.country || "Not set"}</p>
            )}
          </div>

          {profile.dietary_preference && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
              <Label className="font-medium sm:text-right">Diet</Label>
              <div className="sm:col-span-2">
                <Badge variant="secondary" className="capitalize">{profile.dietary_preference}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>My Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't written any reviews yet.</p>
              <Link href="/search">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.comment_id} className="flex gap-4 border-b pb-4 last:border-0">
                  {review.product && (
                    <Link href={`/product/${review.product.product_id}${review.product.slug ? `/${review.product.slug}` : ''}`}>
                      <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {review.product.product_image_url ? (
                          <img
                            src={review.product.product_image_url}
                            alt={review.product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    {review.product && (
                      <Link href={`/product/${review.product.product_id}${review.product.slug ? `/${review.product.slug}` : ''}`}>
                        <h4 className="font-medium hover:text-primary truncate">
                          {review.product.product_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{review.product.brand}</p>
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">{review.overall_rating}/5</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.comment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {review.comment_text && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {review.comment_text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
