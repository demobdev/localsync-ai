"use client";

import { useClerk } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

/**
 * Hard-navigates after optionally activating a Clerk org.
 * Use after onboarding or whenever soft <Link> navigation shows a blank RSC shell.
 */
export function OrgAwareNavButton({
  href,
  organizationId = null,
  children,
  variant = "default",
  size = "default",
  className,
  disabled,
}: {
  href: string;
  organizationId?: string | null;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  const { setActive } = useClerk();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      if (organizationId) {
        await setActive({ organization: organizationId });
      }
      window.location.assign(href);
    } catch {
      setPending(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending}
      onClick={() => void handleClick()}
    >
      {children}
    </Button>
  );
}
