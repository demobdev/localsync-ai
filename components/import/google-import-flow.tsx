"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { importGbpFieldsAction } from "@/app/actions/google-import";
import type { GbpFieldKey, GbpLocation } from "@/lib/connectors/google";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
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

type TargetLocation = {
  id: string;
  name: string;
  profile: LocationProfileSnapshot;
};

function hoursToText(hours: LocationProfileSnapshot["regularHours"]): string {
  const entries = Object.entries(hours);
  if (entries.length === 0) {
    return "—";
  }

  return entries
    .map(([day, value]) =>
      value?.closed ? `${day}: closed` : `${day}: ${value?.open}-${value?.close}`,
    )
    .join(", ");
}

export function GoogleImportFlow({
  gbpLocations,
  targetLocations,
}: {
  gbpLocations: GbpLocation[];
  targetLocations: TargetLocation[];
}) {
  const router = useRouter();
  const [gbpIndex, setGbpIndex] = useState("0");
  const [targetId, setTargetId] = useState(targetLocations[0]?.id ?? "");
  const [selectedFields, setSelectedFields] = useState<GbpFieldKey[]>([]);
  const [isPending, startTransition] = useTransition();

  const gbp = gbpLocations[Number(gbpIndex)];
  const target = targetLocations.find((location) => location.id === targetId);

  const rows = useMemo(() => {
    if (!gbp || !target) {
      return [];
    }

    const master = target.profile;

    const fieldRows: Array<{
      field: GbpFieldKey;
      label: string;
      masterValue: string;
      gbpValue: string;
    }> = [
      {
        field: "name",
        label: "Business name",
        masterValue: master.name || "—",
        gbpValue: gbp.title || "—",
      },
      {
        field: "phone",
        label: "Phone",
        masterValue: master.phone ?? "—",
        gbpValue: gbp.phone ?? "—",
      },
      {
        field: "website",
        label: "Website",
        masterValue: master.website ?? "—",
        gbpValue: gbp.website ?? "—",
      },
      {
        field: "addressLine1",
        label: "Street address",
        masterValue: master.addressLine1 ?? "—",
        gbpValue: gbp.addressLine1 ?? "—",
      },
      {
        field: "city",
        label: "City",
        masterValue: master.city ?? "—",
        gbpValue: gbp.city ?? "—",
      },
      {
        field: "state",
        label: "State",
        masterValue: master.state ?? "—",
        gbpValue: gbp.state ?? "—",
      },
      {
        field: "postalCode",
        label: "Postal code",
        masterValue: master.postalCode ?? "—",
        gbpValue: gbp.postalCode ?? "—",
      },
      {
        field: "regularHours",
        label: "Regular hours",
        masterValue: hoursToText(master.regularHours),
        gbpValue: hoursToText(gbp.regularHours),
      },
    ];

    return fieldRows;
  }, [gbp, target]);

  function toggleField(field: GbpFieldKey) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field],
    );
  }

  function runImport() {
    if (!gbp || !target) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await importGbpFieldsAction({
          targetLocationId: target.id,
          gbpLocation: gbp,
          fields: selectedFields,
        });

        if (result.changed) {
          toast.success(
            `Imported ${result.fieldCount} field${result.fieldCount === 1 ? "" : "s"} — new version created`,
          );
        } else {
          toast.info("Selected fields already match the master profile");
        }

        setSelectedFields([]);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Import failed");
      }
    });
  }

  if (gbpLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Google locations found</CardTitle>
          <CardDescription>
            The connected Google account has no Business Profile locations, or
            access has not been granted yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select source and target</CardTitle>
          <CardDescription>
            Pick a Google Business Profile location and the LocalSync location to
            merge into.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Google location</p>
            <Select value={gbpIndex} onValueChange={(value) => value && setGbpIndex(value)}>
              <SelectTrigger>
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
            <p className="text-sm font-medium">LocalSync location</p>
            <Select value={targetId} onValueChange={(value) => value && setTargetId(value)}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Field-by-field diff</CardTitle>
            <CardDescription>
              Check the fields to import. Import creates a new immutable version
              with source “gbp_import”.
            </CardDescription>
          </div>
          <Button
            onClick={runImport}
            disabled={isPending || selectedFields.length === 0 || !target}
          >
            {isPending
              ? "Importing..."
              : `Import ${selectedFields.length} field${selectedFields.length === 1 ? "" : "s"}`}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => {
            const differs = row.masterValue !== row.gbpValue;

            return (
              <label
                key={row.field}
                className="grid cursor-pointer gap-3 rounded-lg border p-3 md:grid-cols-[24px_140px_1fr_1fr]"
              >
                <Checkbox
                  checked={selectedFields.includes(row.field)}
                  onCheckedChange={() => toggleField(row.field)}
                />
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  {differs ? (
                    <Badge variant="secondary" className="mt-1">
                      differs
                    </Badge>
                  ) : null}
                </div>
                <div className="rounded bg-muted/50 p-2 text-sm">
                  <p className="text-xs text-muted-foreground">Master profile</p>
                  <p className="break-words">{row.masterValue}</p>
                </div>
                <div className="rounded bg-muted/50 p-2 text-sm">
                  <p className="text-xs text-muted-foreground">Google</p>
                  <p className="break-words">{row.gbpValue}</p>
                </div>
              </label>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
