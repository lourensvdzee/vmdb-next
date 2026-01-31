import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Wrench } from "lucide-react";

export const metadata = {
  title: "Admin | VMDb",
  robots: "noindex, nofollow",
};

export default function AdminPage() {
  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>
              The admin dashboard is currently hosted on the original platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              For product approvals, review management, and other admin tasks,
              please access the admin dashboard on the original Vite application.
            </p>

            <div className="flex justify-center pt-4">
              <Button asChild>
                <a
                  href="http://localhost:5173/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Open Admin Dashboard
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-4">
              Note: Make sure the Vite development server is running on port 5173.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
