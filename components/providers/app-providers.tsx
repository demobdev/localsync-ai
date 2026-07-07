"use client";

import { ClerkProvider } from "@clerk/nextjs";

import { PostHogProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Clerk appearance mapped to LocalMap design tokens so embedded Clerk UI
 * (sign-in, org profile, user button) matches the app instead of looking
 * like a foreign iframe.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    card: "shadow-xl border border-border",
    cardBox: "shadow-none",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    formFieldInput: "border-border bg-background",
    footerActionLink: "text-primary hover:text-primary/80",
    navbar: "border-border",
    navbarButton: "text-foreground",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
  },
} as const;

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ThemeProvider>
        <PostHogProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </PostHogProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
