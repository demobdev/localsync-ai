"use client";

import { useClerk } from "@clerk/nextjs";
import {
  ArrowRightIcon,
  Building2Icon,
  CheckIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TeamInvitationWelcome({
  organizationId,
  organizationName,
  role,
  email,
}: {
  organizationId: string;
  organizationName: string;
  role: string;
  email: string;
}) {
  const { setActive, signOut } = useClerk();
  const [pending, setPending] = useState(false);

  async function openWorkspace() {
    setPending(true);
    try {
      await setActive({ organization: organizationId });
      window.location.assign("/dashboard");
    } catch {
      setPending(false);
    }
  }

  async function switchAccount() {
    setPending(true);
    await signOut({ redirectUrl: "/sign-in" });
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/5 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative hidden border-r bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20 localmap-grid" />
          <div className="relative">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
              <Building2Icon className="size-6" />
            </span>
            <h2 className="mt-8 text-3xl font-semibold tracking-tight">
              One workspace. Clear ownership.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-primary-foreground/75">
              Your invitation connects you to the client context, locations,
              and work already organized for this team.
            </p>
          </div>
          <div className="relative space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <CheckIcon className="size-4" />
              Invitation securely accepted
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon className="size-4" />
              Workspace membership confirmed
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon className="size-4" />
              Ready to open LocalMap
            </div>
          </div>
        </div>

        <div className="px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="size-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            You joined {organizationName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Your LocalMap workspace is ready. Open it now to see the shared
            clients, locations, and active work assigned to this team.
          </p>

          <div className="mt-8 divide-y rounded-2xl border bg-background/70">
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UsersIcon className="size-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Workspace</p>
                <p className="mt-0.5 font-medium">{organizationName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-4" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Access level</p>
                <p className="mt-0.5 font-medium">{role}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-5"
              disabled={pending}
              onClick={() => void openWorkspace()}
            >
              {pending ? "Opening workspace…" : "Open workspace"}
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-11 px-4"
              disabled={pending}
              onClick={() => void switchAccount()}
            >
              <LogOutIcon className="size-4" />
              Use a different account
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Signed in as {email}
          </p>
        </div>
      </section>
    </main>
  );
}
