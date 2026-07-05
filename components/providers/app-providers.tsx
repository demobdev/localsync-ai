"use client";

import { ClerkProvider } from "@clerk/nextjs";

import { PostHogProvider } from "@/components/providers/posthog-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <PostHogProvider>
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </PostHogProvider>
    </ClerkProvider>
  );
}
