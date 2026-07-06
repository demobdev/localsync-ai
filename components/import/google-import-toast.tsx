"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function GoogleImportToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }

    if (searchParams.get("connected") === "1") {
      handled.current = true;
      toast.success("Google account connected", {
        description:
          "Loading your Business Profile locations. If none appear, see the status message below.",
      });

      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
