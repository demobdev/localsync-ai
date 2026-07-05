import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              LocalSync AI
            </p>
            <p className="text-sm text-muted-foreground">
              AI-readable local presence for home services
            </p>
          </div>
          {session.userId ? (
            <Button render={<Link href="/dashboard" />}>Open dashboard</Button>
          ) : (
            <Button render={<Link href="/sign-in" />}>Sign in</Button>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Your business data, AI-readable, locally consistent, honestly tracked.
          </h1>
          <p className="text-lg text-muted-foreground">
            LocalSync AI is the control center for home-services local presence:
            master profile, publisher registry, audit evidence, and AI visibility
            pages — without pretending to syndicate where APIs do not exist.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Master profile",
              body: "Versioned NAP, hours, services, photos, and attributes in one canonical record.",
            },
            {
              title: "Honest publisher rails",
              body: "Every destination is typed api, guided import, manual, or audit-only.",
            },
            {
              title: "AI visibility",
              body: "Vertical schema.org, FAQs, llms.txt, and crawl checks for AI-readable pages.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-background p-5">
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
