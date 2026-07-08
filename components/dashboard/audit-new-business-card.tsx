import Link from "next/link";
import { ArrowRightIcon, FileBarChart2Icon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Primary TOFU entry from the dashboard — run the full Local Visibility Grader
 * on any business (yours, a prospect, or a client).
 */
export function AuditNewBusinessCard({ isAgency = false }: { isAgency?: boolean }) {
  return (
    <Card className="localmap-card-glow border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileBarChart2Icon className="size-5 text-primary" />
            {isAgency ? "Audit a client or prospect" : "Audit a business"}
          </CardTitle>
          <CardDescription>
            Run the Local Visibility Grader — 40+ checks, map pack keywords,
            competitors, and revenue-leak estimate. Results link back here
            automatically.
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/grader" />}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="size-4" />
            New visibility audit
            <ArrowRightIcon className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/onboarding?add=1" />}
            className="w-full sm:w-auto"
          >
            Add manually instead
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Signed in? Your audit pre-fills onboarding when you claim a new
          business. Listing audits inside each location track ongoing directory
          consistency.
        </p>
      </CardContent>
    </Card>
  );
}
