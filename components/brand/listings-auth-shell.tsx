import Link from "next/link";
import { LocalMapLogo } from "@/components/brand/localmap-logo";

export function ListingsAuthShell({ children, mode }: { children: React.ReactNode; mode: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  return (
    <div className="localmap-public flex min-h-screen flex-col">
      <header className="bg-[#062f3a] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="LocalMap home"><LocalMapLogo tone="light" /></Link>
          <Link href="/" className="text-sm text-white/80 hover:text-white">Back to LocalMap</Link>
        </div>
      </header>
      <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:gap-20">
        <section className="max-w-sm text-center lg:text-left">
          <p className="text-sm font-semibold text-primary">Your LocalMap workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{signingUp ? "Put your listings in order." : "Welcome back to your listings."}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{signingUp ? "Create your workspace, add your business, and approve the details publishers should show. You can connect Google when you’re ready." : "Review your business profile, listing checks, and the next actions that need your attention."}</p>
          <p className="mt-5 text-sm text-muted-foreground">Signing in with Google creates your LocalMap session. Connecting a Business Profile is a separate step inside your workspace.</p>
        </section>
        <div className="flex w-full max-w-[400px] flex-col items-center gap-4">{children}</div>
      </main>
      <footer className="flex justify-center gap-6 px-4 py-6 text-sm text-muted-foreground"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Get help</Link></footer>
    </div>
  );
}
