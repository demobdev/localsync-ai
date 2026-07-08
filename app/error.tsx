"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page hit an unexpected error. Try again, or return to your dashboard.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
