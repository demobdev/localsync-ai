"use client";

import { CreateOrganization } from "@clerk/nextjs";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function AgencyWorkspaceOption() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm"
      >
        <span className="text-muted-foreground">
          Running an <strong className="text-foreground">agency</strong> managing
          multiple clients? Create a named workspace instead.
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t px-4 py-4">
          <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
        </div>
      ) : null}
    </div>
  );
}
