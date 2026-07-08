"use client";

import { useClerk } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Ensures the new workspace is active in Clerk, then hard-navigates to the
 * dashboard so the server sees a fresh session (avoids blank RSC after setActive).
 */
export function GoToDashboardButton({
  organizationId,
  auditId = null,
  scanId = null,
}: {
  organizationId?: string | null;
  auditId?: string | null;
  scanId?: string | null;
}) {
  const { setActive } = useClerk();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      if (organizationId) {
        await setActive({ organization: organizationId });
      }

      const params = new URLSearchParams();
      if (auditId) params.set("audit", auditId);
      if (scanId) params.set("scan", scanId);
      const qs = params.toString();

      window.location.assign(`/dashboard${qs ? `?${qs}` : ""}`);
    } catch {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" disabled={pending} onClick={() => void handleClick()}>
      {pending ? "Opening dashboard…" : "Go to dashboard"}
      <ArrowRightIcon className="size-4" />
    </Button>
  );
}
