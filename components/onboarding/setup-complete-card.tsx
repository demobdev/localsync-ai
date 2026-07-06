import Link from "next/link";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCircle2Icon,
  GlobeIcon,
  RadarIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SetupCompleteCard({
  locationId,
  publishersTracked,
}: {
  locationId: string;
  publishersTracked: number;
}) {
  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-6" />
        </div>
        <CardTitle>You&apos;re set up!</CardTitle>
        <CardDescription>
          Here&apos;s what we just did behind the scenes:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <BuildingIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Created your workspace and a{" "}
              <strong>master business profile</strong> — the single source of
              truth for your name, phone, address, hours, and services.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <RadarIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Started tracking <strong>{publishersTracked} publishers</strong> —
              directories like Google, Yelp, Angi, and BBB where your business
              info should be consistent. We&apos;ll audit them as you add
              listing URLs.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <GlobeIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Computed your first <strong>visibility score</strong>. It goes up
              as you complete your profile and fix listing inconsistencies.
            </span>
          </li>
        </ul>
        <div className="flex flex-col gap-2">
          <Button
            nativeButton={false}
            render={<Link href={`/dashboard/locations/${locationId}?tab=nap`} />}
          >
            Complete your profile
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/connect" />}
          >
            Connect listings & Google
          </Button>
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
