import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | VMDb",
  description: "Terms of Service for VMDb - Vegan Meat Database",
};

export default function TermsPage() {
  return (
    <main className="flex-1">
      <div className="container px-4 py-8 max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: January 2026</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using VMDb.me (the &quot;Service&quot;), you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              VMDb.me is a community-driven database for vegan and plant-based meat alternatives. The Service
              allows users to discover, rate, and review plant-based products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-2">
              To access certain features of the Service, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content and Conduct</h2>
            <p className="text-muted-foreground mb-2">
              You are responsible for all content you post, including reviews, ratings, and comments. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Post content that is illegal, harmful, threatening, abusive, or discriminatory</li>
              <li>Impersonate any person or entity</li>
              <li>Post spam or irrelevant content</li>
              <li>Violate any intellectual property rights</li>
              <li>Interfere with or disrupt the Service</li>
            </ul>

            {/* Community Guidelines Subsection */}
            <div id="community-guidelines" className="mt-6 pl-4 border-l-4 border-primary/20">
              <h3 className="text-xl font-semibold mb-3">4.1 Community Guidelines</h3>
              <p className="text-muted-foreground mb-4">
                VMDb exists to help people discover great plant-based options through honest, helpful reviews. To keep this community useful and welcoming, we ask that you:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Be Honest</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Share your genuine experience with products you&apos;ve actually tried</li>
                    <li>Rate based on taste, texture, and value — not ideology or brand loyalty</li>
                    <li>One review per product, per person</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Be Helpful</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Write reviews that help others make informed choices</li>
                    <li>Be specific: What did you like? What could be better?</li>
                    <li>Mention context (how you prepared it, what you compared it to)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Be Respectful</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Disagree with products, not people</li>
                    <li>No personal attacks, harassment, or discriminatory language</li>
                    <li>Respect different dietary choices and preferences</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Keep It Real</h4>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>No fake reviews, spam, or promotional content</li>
                    <li>Don&apos;t rate products to manipulate scores</li>
                    <li>No affiliate links or undisclosed brand connections</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">What We Remove</h4>
                  <p className="text-muted-foreground mb-2">We&apos;ll remove content that:</p>
                  <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                    <li>Contains false information or misleading claims</li>
                    <li>Includes hate speech, threats, or harassment</li>
                    <li>Violates someone&apos;s privacy or intellectual property</li>
                    <li>Is spam, off-topic, or irrelevant</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Consequences</h4>
                  <p className="text-muted-foreground">
                    Repeated violations may result in content removal, account suspension, or permanent ban.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Questions?</h4>
                  <p className="text-muted-foreground">
                    Contact us at{" "}
                    <a href="mailto:vmdb.me@gmail.com" className="text-primary hover:underline">
                      vmdb.me@gmail.com
                    </a>{" "}
                    if you&apos;re unsure about something or want to report a violation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Reviews and Ratings</h2>
            <p className="text-muted-foreground">
              We encourage honest reviews based on personal experience. Reviews must comply with our community
              guidelines and these terms. We reserve the right to remove reviews that violate our policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are owned by VMDb.me and are
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <a href="mailto:vmdb.me@gmail.com" className="text-primary hover:underline">
                vmdb.me@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
