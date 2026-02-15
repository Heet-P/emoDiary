// [FILENAME: src/app/page.tsx]
// [PURPOSE: Warm MindSpace-themed landing page]
// [PHASE: UI Redesign v2 - Warm Theme]

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/20">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-[#8ca69e]/5">
        <div className="flex items-center justify-between px-8 md:px-20 py-6 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">spa</span>
            <span className="font-bold tracking-tight text-xl">emoDiary</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-32 relative overflow-hidden">
        {/* Abstract blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full abstract-blob bg-orange-100/40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] rounded-full abstract-blob bg-amber-100/30" />

        <div className="max-w-4xl w-full text-center space-y-10 relative z-10">
          <div className="space-y-6 fade-in-up">
            <h1 className="serif-text text-5xl md:text-7xl font-light leading-tight tracking-tight">
              A Quiet Place for Your <br className="hidden md:block" />
              Loudest Thoughts
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed">
              An intentional space to process, understand, and find peace within your emotions.
              Designed for the thoughtful mind.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 fade-in-up delay-200">
            <Link
              href="/sign-up"
              className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              Get Started
              <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] text-[#8ca69e] font-semibold">
              Free to begin your journey
            </span>
          </div>
        </div>
      </main>

      {/* Pillars Section */}
      <section className="max-w-[1200px] mx-auto px-6 py-32 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Reflect */}
          <div className="group flex flex-col p-10 md:p-12 rounded-xl border border-[#8ca69e]/20 backdrop-blur-sm transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 bg-white/60">
            <div className="mb-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">edit_note</span>
            </div>
            <h2 className="serif-text text-2xl font-bold mb-4">Reflect</h2>
            <p className="text-foreground/70 leading-relaxed font-light">
              Document your daily journey with guided prompts designed for depth and emotional clarity.
            </p>
          </div>

          {/* Discover */}
          <div className="group flex flex-col p-10 md:p-12 rounded-xl border border-[#8ca69e]/20 backdrop-blur-sm transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 bg-white/60">
            <div className="mb-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">insights</span>
            </div>
            <h2 className="serif-text text-2xl font-bold mb-4">Discover</h2>
            <p className="text-foreground/70 leading-relaxed font-light">
              Uncover patterns in your mood and thoughts over time with sophisticated visual analytics.
            </p>
          </div>

          {/* Grow */}
          <div className="group flex flex-col p-10 md:p-12 rounded-xl border border-[#8ca69e]/20 backdrop-blur-sm transition-all hover:border-[#8ca69e]/40 hover:shadow-xl hover:shadow-[#8ca69e]/5 bg-white/60">
            <div className="mb-8 w-12 h-12 flex items-center justify-center rounded-full bg-[#8ca69e]/10 text-[#8ca69e] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <h2 className="serif-text text-2xl font-bold mb-4">Grow</h2>
            <p className="text-foreground/70 leading-relaxed font-light">
              Cultivate emotional resilience through mindful exercises backed by cognitive behavioral science.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Spotlight */}
      <section className="bg-[#064e3b] text-[#fefcfa] py-32 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="serif-text text-4xl md:text-5xl leading-tight">
              A Sanctuary in Your Pocket
            </h2>
            <p className="text-lg text-[#fefcfa]/80 font-light leading-relaxed">
              emoDiary is more than an app; it is a ritual. Every interaction is designed to slow
              down the frantic pace of digital life, offering you a private chamber for your inner world.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="font-light">End-to-end encrypted reflection logs</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="font-light">Weekly emotional resonance reports</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">check_circle</span>
                <span className="font-light">Calming auditory soundscapes</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-[#8ca69e]/30 backdrop-blur-3xl border border-white/10 flex flex-col p-8 justify-between">
              <div className="space-y-4">
                <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                <div className="h-2 w-1/2 bg-white/20 rounded-full" />
              </div>
              <div className="bg-white/10 p-6 rounded-xl border border-white/10">
                <p className="serif-text italic text-lg">&ldquo;How are you feeling in this very moment?&rdquo;</p>
                <div className="mt-6 flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#8ca69e]/40" />
                  <div className="w-8 h-8 rounded-full bg-primary/40" />
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-12">
          <h2 className="serif-text text-3xl md:text-5xl">Begin Your Quiet Reflection</h2>
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/sign-up"
              className="bg-[#064e3b] text-[#fefcfa] px-12 py-5 rounded-lg font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
            >
              Start Your Journal
            </Link>
            <p className="text-[#8ca69e] font-medium tracking-widest text-sm uppercase">
              Secure • Private • Mindful
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#8ca69e]/10 py-20 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">spa</span>
              <span className="font-bold tracking-tight text-lg">emoDiary</span>
            </div>
            <p className="text-foreground/50 text-xs tracking-widest uppercase">
              © 2025 emoDiary. All rights reserved.
            </p>
          </div>
          <div className="flex gap-12 text-sm text-foreground/60">
            <span className="hover:text-primary transition-colors uppercase tracking-widest cursor-pointer">
              Privacy
            </span>
            <span className="hover:text-primary transition-colors uppercase tracking-widest cursor-pointer">
              Terms
            </span>
            <span className="hover:text-primary transition-colors uppercase tracking-widest cursor-pointer">
              Contact
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
