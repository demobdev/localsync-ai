import Link from "next/link";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircle2Icon,
  FileBarChart2Icon,
  GlobeIcon,
  RadarIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrganizationType } from "@/lib/auth/organizations";

export function SetupCompleteCard({
  locationId,
  publishersTracked,
  accountType = "business",
  auditId = null,
}: {
  locationId: string;
  publishersTracked: number;
  accountType?: OrganizationType;
  /** Claimed grader audit — links back to the full report. */
  auditId?: string | null;
}) {
  const isAgency = accountType === "agency";

  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <div
          className={`mb-2 flex size-12 items-center justify-center rounded-2xl ${
            isAgency
              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          <CheckCircle2Icon className="size-6" />
        </div>
        <CardTitle>
          {isAgency ? "Your agency workspace is ready" : "You're set up!"}
        </CardTitle>
        <CardDescription>
          {isAgency
            ? "Your first client is live. Here's what we set up:"
            : "Here's what we just did behind the scenes:"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3 text-sm">
          {isAgency ? (
            <>
              <li className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <span>
                  Created your <strong>agency workspace</strong> and a{" "}
                  <strong>client record</strong> for your first end-customer —
                  ready for more clients from the Clients page.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <BuildingIcon className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <span>
                  Built a <strong>master business profile</strong> for this
                  client — name, phone, address, hours, and services in one
                  place.
                </span>
              </li>
            </>
          ) : (
            <li className="flex items-start gap-3">
              <BuildingIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Created your workspace and a{" "}
                <strong>master business profile</strong> — the single source of
                truth for your name, phone, address, hours, and services.
              </span>
            </li>
          )}
          <li className="flex items-start gap-3">
            <RadarIcon
              className={`mt-0.5 size-4 shrink-0 ${
                isAgency
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-primary"
              }`}
            />
            <span>
              Started tracking <strong>{publishersTracked} publishers</strong> —
              directories like Google, Yelp, Angi, and BBB where{" "}
              {isAgency ? "this client" : "your business"} should be consistent.
              We&apos;ll audit them as you add listing URLs.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <GlobeIcon
              className={`mt-0.5 size-4 shrink-0 ${
                isAgency
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-primary"
              }`}
            />
            <span>
              Computed the first <strong>visibility score</strong>. It goes up as
              you complete the profile and fix listing inconsistencies.
            </span>
          </li>
        </ul>
        <div className="flex flex-col gap-2">
          <Button
            nativeButton={false}
            render={
              <Link href={`/dashboard/locations/${locationId}?tab=nap`} />
            }
          >
            {isAgency ? "Complete client profile" : "Complete your profile"}
            <ArrowRightIcon className="size-4" />
          </Button>
          {auditId ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/grader/${auditId}`} />}
            >
              <FileBarChart2Icon className="size-4" />
              View your full audit report
            </Button>
          ) : null}
          {isAgency ? (
            <>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/team" />}
              >
                <UserPlusIcon className="size-4" />
                Invite your team
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/clients" />}
              >
                Manage clients
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/connect" />}
            >
              Connect listings & Google
            </Button>
          )}
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Go to dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
