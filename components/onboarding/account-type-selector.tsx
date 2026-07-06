"use client";

import { Building2Icon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AccountType = "business" | "agency";

export function AccountTypeSelector({
  onSelect,
}: {
  onSelect: (type: AccountType) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="localmap-card-glow transition-colors hover:border-primary/40">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2Icon className="size-5" />
          </div>
          <CardTitle className="text-lg">Business owner</CardTitle>
          <CardDescription>
            I manage one business (or a few locations for the same brand).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => onSelect("business")}>
            Continue as a business
          </Button>
        </CardContent>
      </Card>

      <Card className="localmap-card-glow transition-colors hover:border-primary/40">
        <CardHeader>
          <div
            className={cn(
              "mb-2 flex size-10 items-center justify-center rounded-xl",
              "bg-violet-500/10 text-violet-600 dark:text-violet-400",
            )}
          >
            <UsersIcon className="size-5" />
          </div>
          <CardTitle className="text-lg">Agency</CardTitle>
          <CardDescription>
            I manage listings for multiple client businesses from one workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSelect("agency")}
          >
            Continue as an agency
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
