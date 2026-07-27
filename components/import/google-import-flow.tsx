"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  importGbpFieldsAction,
  pushGbpFieldsAction,
} from "@/app/actions/google-import";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GbpFieldKey, GbpLocation } from "@/lib/connectors/google";
import { compareGoogleProfile } from "@/lib/connectors/google-profile-diff";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import { cn } from "@/lib/utils";

type TargetLocation = {
  id: string;
  name: string;
  profile: LocationProfileSnapshot;
};

type ReconcileDirection = "google-to-master" | "master-to-google";

export function GoogleImportFlow({
  gbpLocations,
  targetLocations,
  canPush = false,
}: {
  gbpLocations: GbpLocation[];
  targetLocations: TargetLocation[];
  canPush?: boolean;
}) {
  const router = useRouter();
  const [gbpIndex, setGbpIndex] = useState("0");
  const [targetId, setTargetId] = useState(targetLocations[0]?.id ?? "");
  const [direction, setDirection] =
    useState<ReconcileDirection>("google-to-master");
  const [selectedFields, setSelectedFields] = useState<GbpFieldKey[]>([]);
  const [isPending, startTransition] = useTransition();

  const gbp = gbpLocations[Number(gbpIndex)];
  const target = targetLocations.find((location) => location.id === targetId);
  const comparisons = useMemo(
    () => (gbp && target ? compareGoogleProfile(target.profile, gbp) : []),
    [gbp, target],
  );
  const differences = comparisons.filter((comparison) => !comparison.matches);

  function toggleField(field: GbpFieldKey) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field],
    );
  }

  function selectAllDifferences() {
    setSelectedFields(differences.map((comparison) => comparison.field));
  }

  function reconcile() {
    if (!gbp || !target || selectedFields.length === 0) return;

    startTransition(async () => {
      try {
        if (direction === "google-to-master") {
          const result = await importGbpFieldsAction({
            targetLocationId: target.id,
            gbpLocation: gbp,
            fields: selectedFields,
          });

          if (!result.changed) {
            toast.info("Those fields already match the Master Profile");
          } else if (result.verified) {
            toast.success(
              `Updated ${result.fieldCount} field${result.fieldCount === 1 ? "" : "s"} — Google is verified and matches`,
            );
          } else {
            toast.success(
              `Updated ${result.fieldCount} field${result.fieldCount === 1 ? "" : "s"} — remaining differences still need review`,
            );
          }
        } else {
          const result = await pushGbpFieldsAction({
            locationId: target.id,
            fields: selectedFields,
            gbpName: gbp.gbpName,
          });

          if (result.verified) {
            toast.success(
              `Google accepted the update and all supported fields were verified`,
            );
          } else {
            toast.info(
              "Google accepted the update. Status remains pending until a fresh read matches the Master Profile.",
            );
          }
        }

        setSelectedFields([]);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Google update failed",
        );
      }
    });
  }

  function confirmMatchingListing() {
    if (!gbp || !target) return;

    startTransition(async () => {
      try {
        const result = await importGbpFieldsAction({
          targetLocationId: target.id,
          gbpLocation: gbp,
          fields: ["name"],
        });
        toast.success(
          result.verified
            ? "Listing confirmed — Google is verified and all supported fields match"
            : "Listing confirmed — ownership verification is still pending",
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not confirm listing",
        );
      }
    });
  }

  if (gbpLocations.length === 0) return null;

  if (targetLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create a Master Profile first</CardTitle>
          <CardDescription>
            Google locations are available, but this workspace needs a business
            location before you can compare or approve fields.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pushUnavailable =
    direction === "master-to-google" && (!canPush || gbp?.canUpdate === false);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">Step 3 of 4</Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  Review before anything changes
                </span>
              </div>
              <CardTitle>Resolve profile differences</CardTitle>
              <CardDescription className="mt-1.5">
                Compare the approved LocalMap Master Profile with the live Google
                record, choose a direction, then approve only the fields you want.
              </CardDescription>
            </div>
            <div className="flex rounded-xl border bg-background p-1">
              <button
                type="button"
                aria-pressed={direction === "google-to-master"}
                onClick={() => {
                  setDirection("google-to-master");
                  setSelectedFields([]);
                }}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  direction === "google-to-master"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowDownToLineIcon className="size-4" />
                Use Google data
              </button>
              <button
                type="button"
                aria-pressed={direction === "master-to-google"}
                onClick={() => {
                  setDirection("master-to-google");
                  setSelectedFields([]);
                }}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  direction === "master-to-google"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowUpFromLineIcon className="size-4" />
                Send Master Profile
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Google listing</p>
              <Select
                items={gbpLocations.map((location, index) => ({
                  value: String(index),
                  label: `${location.title}${location.city ? ` — ${location.city}` : ""}`,
                }))}
                value={gbpIndex}
                onValueChange={(value) => {
                  if (!value) return;
                  setGbpIndex(value);
                  setSelectedFields([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gbpLocations.map((location, index) => (
                    <SelectItem key={location.gbpName} value={String(index)}>
                      {location.title}
                      {location.city ? ` — ${location.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">LocalMap Master Profile</p>
              <Select
                items={targetLocations.map((location) => ({
                  value: location.id,
                  label: location.name,
                }))}
                value={targetId}
                onValueChange={(value) => {
                  if (!value) return;
                  setTargetId(value);
                  setSelectedFields([]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {targetLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {differences.length === 0 ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium">All supported fields match</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  LocalMap can show Live &amp; synced only after Google ownership
                  is also verified.
                </p>
              </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={confirmMatchingListing}
                disabled={isPending}
              >
                Confirm this listing
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {differences.length} difference
                    {differences.length === 1 ? "" : "s"} found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Matching fields are visible for proof but cannot be selected.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selectAllDifferences}
                >
                  Select all differences
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <div className="hidden grid-cols-[40px_150px_1fr_1fr] gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
                  <span />
                  <span>Field</span>
                  <span>Master Profile</span>
                  <span>Google</span>
                </div>
                {comparisons.map((row) => (
                  <label
                    key={row.field}
                    className={cn(
                      "grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[40px_150px_1fr_1fr] md:items-start",
                      row.matches
                        ? "cursor-default bg-muted/15"
                        : "cursor-pointer hover:bg-muted/25",
                    )}
                  >
                    <Checkbox
                      checked={selectedFields.includes(row.field)}
                      disabled={row.matches}
                      onCheckedChange={() => toggleField(row.field)}
                      aria-label={`Select ${row.label}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{row.label}</p>
                      {row.matches ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-700"
                        >
                          Match
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Review</Badge>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-muted-foreground uppercase md:hidden">
                        Master Profile
                      </p>
                      <p className="break-words text-sm leading-relaxed">
                        {row.masterValue}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-muted-foreground uppercase md:hidden">
                        Google
                      </p>
                      <p className="break-words text-sm leading-relaxed">
                        {row.googleValue}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {pushUnavailable ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium">
                {gbp?.canUpdate === false
                  ? "Google has blocked updates for this listing"
                  : "Direct Google synchronization requires Premium"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {gbp?.canUpdate === false
                  ? "Resolve the listing restriction in Google Business Profile, then refresh this page."
                  : "You can still compare and import Google data on this plan."}
              </p>
              {!canPush && gbp?.canUpdate !== false ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  nativeButton={false}
                  render={<Link href="/dashboard/billing" />}
                >
                  View plans
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-xl items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                {direction === "master-to-google"
                  ? "After Google accepts the write, LocalMap reads the listing again. Until the complete supported profile matches, status stays Pending verification."
                  : "Imports create an immutable Master Profile version with Google recorded as the source."}
              </p>
            </div>
            <Button
              onClick={reconcile}
              disabled={
                isPending ||
                selectedFields.length === 0 ||
                !target ||
                pushUnavailable
              }
              className="min-w-52"
            >
              {isPending
                ? direction === "master-to-google"
                  ? "Sending to Google…"
                  : "Updating Master Profile…"
                : direction === "master-to-google"
                  ? `Approve & send ${selectedFields.length || ""} field${selectedFields.length === 1 ? "" : "s"}`
                  : `Use Google for ${selectedFields.length || ""} field${selectedFields.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
