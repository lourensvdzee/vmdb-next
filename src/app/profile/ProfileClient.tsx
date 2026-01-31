"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Loader2, Edit, Save, X, Trash2, Upload, Star, Settings, ChevronDown, LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  age: number | null;
  gender: string | null;
  dietary_preference: string | null;
  food_allergies: string[] | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
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

interface RecommendedProduct {
  id: number;
  name: string;
  brand: string;
  image_url: string | null;
  avg_rating: number;
  slug: string | null;
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);

  // Form fields
  const [username, setUsername] = useState(profile?.username || "");
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [gender, setGender] = useState(profile?.gender || "");
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [customDietaryPreference, setCustomDietaryPreference] = useState("");
  const [foodAllergies, setFoodAllergies] = useState(profile?.food_allergies?.join(", ") || "");
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");

  // Initialize dietary preference
  useEffect(() => {
    if (profile?.dietary_preference) {
      const standardPreferences = ["vegan", "vegetarian", "pescatarian", "flexitarian", "omnivore"];
      if (standardPreferences.includes(profile.dietary_preference.toLowerCase())) {
        setDietaryPreference(profile.dietary_preference.toLowerCase());
        setCustomDietaryPreference("");
      } else {
        setDietaryPreference("custom");
        setCustomDietaryPreference(profile.dietary_preference);
      }
    }
  }, [profile?.dietary_preference]);

  // Fetch recommended products
  useEffect(() => {
    async function fetchRecommended() {
      if (!profile?.id) return;

      const { data: products } = await supabase
        .from("products")
        .select("product_id, product_name, brand, product_image_url, slug")
        .eq("product_status", "publish")
        .order("product_id", { ascending: false })
        .limit(20);

      if (!products) return;

      // Get ratings for each product
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const { data: comments } = await supabase
            .from("comments")
            .select("overall_rating")
            .eq("product_id", product.product_id)
            .eq("is_approved", 1);

          let avgRating = 0;
          if (comments && comments.length > 0) {
            const validRatings = comments
              .map((c) => c.overall_rating)
              .filter((r) => r != null && r > 0);
            if (validRatings.length > 0) {
              avgRating = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
            }
          }

          return {
            id: product.product_id,
            name: product.product_name,
            brand: product.brand,
            image_url: product.product_image_url,
            avg_rating: avgRating,
            slug: product.slug,
          };
        })
      );

      // Sort by rating and take top 10
      const sorted = productsWithRatings
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 10);

      setRecommendedProducts(sorted);
    }

    fetchRecommended();
  }, [profile?.id, supabase]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Check file size (100KB = 102400 bytes)
    if (file.size > 102400) {
      toast.error("Image must be smaller than 100KB. Please compress your image.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated");
      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);

    try {
      const finalDietaryPreference = dietaryPreference === "custom"
        ? customDietaryPreference.trim() || null
        : dietaryPreference || null;

      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          name: name.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          country: country.trim() || null,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          dietary_preference: finalDietaryPreference,
          food_allergies: foodAllergies
            ? foodAllergies.split(",").map((a) => a.trim()).filter((a) => a)
            : null,
          facebook_url: facebookUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
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
    setAge(profile?.age?.toString() || "");
    setGender(profile?.gender || "");
    setFoodAllergies(profile?.food_allergies?.join(", ") || "");
    setFacebookUrl(profile?.facebook_url || "");
    setInstagramUrl(profile?.instagram_url || "");
    setLinkedinUrl(profile?.linkedin_url || "");

    if (profile?.dietary_preference) {
      const standardPreferences = ["vegan", "vegetarian", "pescatarian", "flexitarian", "omnivore"];
      if (standardPreferences.includes(profile.dietary_preference.toLowerCase())) {
        setDietaryPreference(profile.dietary_preference.toLowerCase());
        setCustomDietaryPreference("");
      } else {
        setDietaryPreference("custom");
        setCustomDietaryPreference(profile.dietary_preference);
      }
    } else {
      setDietaryPreference("");
      setCustomDietaryPreference("");
    }

    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail === userEmail) {
      toast.error("This is already your current email");
      return;
    }

    if (!emailChangePassword) {
      toast.error("Please enter your current password to confirm this change");
      return;
    }

    setIsChangingEmail(true);

    try {
      // First verify password by signing in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: emailChangePassword,
      });

      if (authError) {
        toast.error("Incorrect password. Please try again.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success("Verification emails sent to both addresses!");
      setNewEmail("");
      setEmailChangePassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send verification email";
      toast.error(message);
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile?.id);

      if (profileError) throw profileError;

      await supabase.auth.signOut();

      toast.success("Account deleted successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = () => {
    if (profile?.name) {
      return profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return profile?.username?.slice(0, 2).toUpperCase() || "?";
  };

  const getProductUrl = (product: { id?: number; product_id?: number; slug?: string | null }) => {
    const id = product.id || product.product_id;
    return product.slug ? `/product/${id}/${product.slug}` : `/product/${id}`;
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
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="relative flex-shrink-0">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
            <AvatarFallback className="text-xl sm:text-2xl">{getInitials()}</AvatarFallback>
          </Avatar>
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
            </label>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">{profile.name || profile.username}</h1>
          {profile.name && <p className="text-muted-foreground truncate">@{profile.username}</p>}
          <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
          {profile.location && profile.country && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
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
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Username */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
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

          {/* Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
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

          {/* Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Age</Label>
            {isEditing ? (
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Your age"
                min="13"
                max="120"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.age || "Not set"}</p>
            )}
          </div>

          {/* Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Gender</Label>
            {isEditing ? (
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="sm:col-span-2">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="sm:col-span-2 text-muted-foreground capitalize">
                {profile.gender || "Not set"}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <Label className="font-medium sm:text-right sm:pt-2">Bio</Label>
            {isEditing ? (
              <div className="sm:col-span-2">
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/500 characters
                </p>
              </div>
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.bio || "No bio yet"}</p>
            )}
          </div>

          {/* City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">City</Label>
            {isEditing ? (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Amsterdam"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.location || "Not set"}</p>
            )}
          </div>

          {/* Country */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Country</Label>
            {isEditing ? (
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Netherlands"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">{profile.country || "Not set"}</p>
            )}
          </div>

          {/* Dietary Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Dietary Preference</Label>
            {isEditing ? (
              <div className="sm:col-span-2 space-y-2">
                <Select value={dietaryPreference} onValueChange={setDietaryPreference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                    <SelectItem value="flexitarian">Flexitarian</SelectItem>
                    <SelectItem value="omnivore">Omnivore</SelectItem>
                    <SelectItem value="custom">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>
                {dietaryPreference === "custom" && (
                  <Input
                    value={customDietaryPreference}
                    onChange={(e) => setCustomDietaryPreference(e.target.value)}
                    placeholder="Enter your dietary preference"
                  />
                )}
              </div>
            ) : (
              <p className="sm:col-span-2 text-muted-foreground capitalize">
                {profile.dietary_preference || "Not set"}
              </p>
            )}
          </div>

          {/* Food Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Food Allergies</Label>
            {isEditing ? (
              <div className="sm:col-span-2">
                <Input
                  value={foodAllergies}
                  onChange={(e) => setFoodAllergies(e.target.value)}
                  placeholder="e.g., nuts, soy, gluten"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate with commas
                </p>
              </div>
            ) : (
              <p className="sm:col-span-2 text-muted-foreground">
                {profile.food_allergies?.join(", ") || "None"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Facebook */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Facebook</Label>
            {isEditing ? (
              <Input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourprofile"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground break-all">
                {profile.facebook_url ? (
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.facebook_url}
                  </a>
                ) : (
                  "Not set"
                )}
              </p>
            )}
          </div>

          {/* Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">Instagram</Label>
            {isEditing ? (
              <Input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground break-all">
                {profile.instagram_url ? (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.instagram_url}
                  </a>
                ) : (
                  "Not set"
                )}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start sm:items-center">
            <Label className="font-medium sm:text-right">LinkedIn</Label>
            {isEditing ? (
              <Input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="sm:col-span-2"
              />
            ) : (
              <p className="sm:col-span-2 text-muted-foreground break-all">
                {profile.linkedin_url ? (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.linkedin_url}
                  </a>
                ) : (
                  "Not set"
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recommended Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recommendedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={getProductUrl(product)}
                  className="flex-shrink-0 w-40 hover:opacity-80 transition-opacity"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                  {product.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{product.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Latest Rated Products (horizontal scroll) */}
      {reviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Latest Rated Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {reviews.map((review) => (
                review.product && (
                  <Link
                    key={review.comment_id}
                    href={`/product/${review.product.product_id}${review.product.slug ? `/${review.product.slug}` : ''}`}
                    className="flex-shrink-0 w-40 hover:opacity-80 transition-opacity"
                  >
                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                      {review.product.product_image_url ? (
                        <img
                          src={review.product.product_image_url}
                          alt={review.product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm truncate">{review.product.product_name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{review.product.brand}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{review.overall_rating}/5</span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for reviews */}
      {reviews.length === 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't written any reviews yet.</p>
              <Link href="/search">
                <Button>Browse Products</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Section */}
      <Card>
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Settings</CardTitle>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Change Email Section */}
              <div>
                <h3 className="text-sm font-medium mb-2">Change Email</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Current email: {userEmail}
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="new@email.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={isChangingEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-change-password">Current Password</Label>
                    <Input
                      id="email-change-password"
                      type="password"
                      placeholder="Enter your current password"
                      value={emailChangePassword}
                      onChange={(e) => setEmailChangePassword(e.target.value)}
                      disabled={isChangingEmail}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required to confirm this security change
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangeEmail}
                    disabled={isChangingEmail || !newEmail || !emailChangePassword}
                  >
                    {isChangingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Verification Emails
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    For security, you'll need to verify from both your current and new email addresses.
                  </p>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">Change Password</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmNewPassword}
                  >
                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-destructive mb-4">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers, including:
                          <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All your reviews and ratings</li>
                            <li>Your favorites and preferences</li>
                            <li>Your account credentials</li>
                          </ul>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </>
  );
}
