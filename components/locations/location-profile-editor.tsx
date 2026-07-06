"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  compareLocationVersionsAction,
  listLocationVersionsAction,
  updateLocationProfileAction,
} from "@/app/actions/locations";
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  DayOfWeek,
  HolidayHoursEntry,
  LocationPhoto,
  LocationProfileSnapshot,
  RegularHours,
} from "@/lib/types/location-profile";

type Taxonomy = {
  categories: Array<{ slug: string; name: string }>;
  services: Array<{ slug: string; name: string; categorySlug: string }>;
};

type VersionRow = Awaited<
  ReturnType<typeof listLocationVersionsAction>
>[number];

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function LocationProfileEditor({
  locationId,
  initialProfile,
  taxonomy,
  initialVersions,
  activeTab,
  onTabChange,
}: {
  locationId: string;
  initialProfile: LocationProfileSnapshot;
  taxonomy: Taxonomy;
  initialVersions: VersionRow[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [internalTab, setInternalTab] = useState("nap");
  const currentTab = activeTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const [versions, setVersions] = useState(initialVersions);
  const [fromVersionId, setFromVersionId] = useState(
    initialVersions[1]?.id ?? initialVersions[0]?.id ?? "",
  );
  const [toVersionId, setToVersionId] = useState(initialVersions[0]?.id ?? "");
  const [diff, setDiff] = useState<
    Awaited<ReturnType<typeof compareLocationVersionsAction>>
  >([]);
  const [isPending, startTransition] = useTransition();

  const filteredServices = useMemo(() => {
    if (!profile.categorySlug) {
      return taxonomy.services;
    }

    return taxonomy.services.filter(
      (service) => service.categorySlug === profile.categorySlug,
    );
  }, [profile.categorySlug, taxonomy.services]);

  function updateField<K extends keyof LocationProfileSnapshot>(
    key: K,
    value: LocationProfileSnapshot[K],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateRegularHours(day: DayOfWeek, patch: Partial<RegularHours[DayOfWeek]>) {
    setProfile((current) => ({
      ...current,
      regularHours: {
        ...current.regularHours,
        [day]: {
          ...current.regularHours[day],
          ...patch,
        },
      },
    }));
  }

  function addHolidayHours() {
    setProfile((current) => ({
      ...current,
      holidayHours: [
        ...current.holidayHours,
        { date: "", label: "", closed: false, open: "09:00", close: "17:00" },
      ],
    }));
  }

  function updateHolidayHours(index: number, patch: Partial<HolidayHoursEntry>) {
    setProfile((current) => ({
      ...current,
      holidayHours: current.holidayHours.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function removeHolidayHours(index: number) {
    setProfile((current) => ({
      ...current,
      holidayHours: current.holidayHours.filter(
        (_, entryIndex) => entryIndex !== index,
      ),
    }));
  }

  function toggleService(slug: string) {
    setProfile((current) => ({
      ...current,
      serviceSlugs: current.serviceSlugs.includes(slug)
        ? current.serviceSlugs.filter((value) => value !== slug)
        : [...current.serviceSlugs, slug],
    }));
  }

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const payload = (await response.json()) as { url: string };
    const photo: LocationPhoto = {
      id: crypto.randomUUID(),
      url: payload.url,
      sortOrder: profile.photos.length,
      category: "other",
    };

    setProfile((current) => ({
      ...current,
      photos: [...current.photos, photo],
    }));
  }

  function saveProfile() {
    startTransition(async () => {
      try {
        await updateLocationProfileAction({ locationId, profile });
        const nextVersions = await listLocationVersionsAction(locationId);
        setVersions(nextVersions);
        toast.success("Profile saved and versioned");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save profile",
        );
      }
    });
  }

  function compareVersions() {
    startTransition(async () => {
      try {
        const result = await compareLocationVersionsAction({
          locationId,
          fromVersionId,
          toVersionId,
        });
        setDiff(result);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to compare versions",
        );
      }
    });
  }

  return (
    <div className="relative space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button onClick={saveProfile} disabled={isPending} className="hidden sm:inline-flex">
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="nap">NAP</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="nap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Name, address, phone</CardTitle>
              <CardDescription>
                Canonical NAP data used for audits and AI visibility pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Business name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={profile.description ?? ""}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone ?? ""}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email ?? ""}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website ?? ""}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address line 1</Label>
                <Input
                  id="addressLine1"
                  value={profile.addressLine1 ?? ""}
                  onChange={(event) =>
                    updateField("addressLine1", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">Address line 2</Label>
                <Input
                  id="addressLine2"
                  value={profile.addressLine2 ?? ""}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city ?? ""}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile.state ?? ""}
                  onChange={(event) => updateField("state", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  value={profile.postalCode ?? ""}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country ?? "US"}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={profile.latitude ?? ""}
                  onChange={(event) =>
                    updateField(
                      "latitude",
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={profile.longitude ?? ""}
                  onChange={(event) =>
                    updateField(
                      "longitude",
                      event.target.value ? Number(event.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Primary category</Label>
                <Select
                  value={profile.categorySlug ?? ""}
                  onValueChange={(value) =>
                    value && updateField("categorySlug", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomy.categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day) => {
                const hours = profile.regularHours[day];
                return (
                  <div
                    key={day}
                    className="grid gap-3 rounded-lg border p-3 md:grid-cols-[120px_1fr_1fr_auto]"
                  >
                    <div className="font-medium capitalize">{day}</div>
                    <Input
                      type="time"
                      value={hours?.open ?? "09:00"}
                      disabled={hours?.closed}
                      onChange={(event) =>
                        updateRegularHours(day, { open: event.target.value })
                      }
                    />
                    <Input
                      type="time"
                      value={hours?.close ?? "17:00"}
                      disabled={hours?.closed}
                      onChange={(event) =>
                        updateRegularHours(day, { close: event.target.value })
                      }
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={hours?.closed ?? false}
                        onCheckedChange={(checked) =>
                          updateRegularHours(day, { closed: checked === true })
                        }
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Holiday hours</CardTitle>
                <CardDescription>Special dates override regular hours.</CardDescription>
              </div>
              <Button variant="outline" onClick={addHolidayHours}>
                Add date
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.holidayHours.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No holiday hours configured yet.
                </p>
              ) : (
                profile.holidayHours.map((entry, index) => (
                  <div
                    key={`${entry.date}-${index}`}
                    className="grid gap-3 rounded-lg border p-3 md:grid-cols-5"
                  >
                    <Input
                      type="date"
                      value={entry.date}
                      onChange={(event) =>
                        updateHolidayHours(index, { date: event.target.value })
                      }
                    />
                    <Input
                      placeholder="Label"
                      value={entry.label ?? ""}
                      onChange={(event) =>
                        updateHolidayHours(index, { label: event.target.value })
                      }
                    />
                    <Input
                      type="time"
                      value={entry.open ?? "09:00"}
                      disabled={entry.closed}
                      onChange={(event) =>
                        updateHolidayHours(index, { open: event.target.value })
                      }
                    />
                    <Input
                      type="time"
                      value={entry.close ?? "17:00"}
                      disabled={entry.closed}
                      onChange={(event) =>
                        updateHolidayHours(index, { close: event.target.value })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={entry.closed ?? false}
                        onCheckedChange={(checked) =>
                          updateHolidayHours(index, { closed: checked === true })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHolidayHours(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Select services from the home-services taxonomy.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {filteredServices.map((service) => (
                <label
                  key={service.slug}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={profile.serviceSlugs.includes(service.slug)}
                    onCheckedChange={() => toggleService(service.slug)}
                  />
                  <span>
                    <span className="block font-medium">{service.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {service.categorySlug}
                    </span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
              <CardDescription>
                Structured business attributes for publishers and schema output.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(profile.attributes).map(([key, value]) => (
                <div key={key} className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                  <Input value={key} disabled />
                  <Input
                    value={String(value)}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        attributes: {
                          ...current.attributes,
                          [key]: event.target.value,
                        },
                      }))
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setProfile((current) => {
                        const next = { ...current.attributes };
                        delete next[key];
                        return { ...current, attributes: next };
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [`attribute_${Object.keys(current.attributes).length + 1}`]:
                        "",
                    },
                  }))
                }
              >
                Add attribute
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Upload logos, cover photos, and team images via Vercel Blob.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  try {
                    await uploadPhoto(file);
                    toast.success("Photo uploaded");
                  } catch {
                    toast.error("Photo upload failed");
                  }
                }}
              />
              <div className="grid gap-4 md:grid-cols-3">
                {profile.photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.caption ?? "Location photo"}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Links & sameAs</CardTitle>
              <CardDescription>
                Social profiles and directory URLs for schema.org `sameAs`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.sameAs.map((url, index) => (
                <div key={`${url}-${index}`} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        sameAs: current.sameAs.map((entry, entryIndex) =>
                          entryIndex === index ? event.target.value : entry,
                        ),
                      }))
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        sameAs: current.sameAs.filter(
                          (_, entryIndex) => entryIndex !== index,
                        ),
                      }))
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setProfile((current) => ({
                    ...current,
                    sameAs: [...current.sameAs, ""],
                  }))
                }
              >
                Add link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Version history</CardTitle>
          <CardDescription>
            Compare any two immutable snapshots from this location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Select
              value={fromVersionId}
              onValueChange={(value) => setFromVersionId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="From version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    v{version.versionNumber} — {version.changeSummary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={toVersionId}
              onValueChange={(value) => setToVersionId(value ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="To version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    v{version.versionNumber} — {version.changeSummary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={compareVersions} disabled={isPending}>
              Compare
            </Button>
          </div>

          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    Version {version.versionNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {version.changeSummary ?? "Updated profile"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{version.source}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(version.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {diff.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Diff results</h3>
              {diff.map((entry) => (
                <div key={entry.field} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{entry.label}</p>
                  <p className="mt-2 text-muted-foreground">Before</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {entry.before || "—"}
                  </pre>
                  <p className="mt-2 text-muted-foreground">After</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {entry.after || "—"}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur-md sm:hidden">
        <Button onClick={saveProfile} disabled={isPending} className="w-full">
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <ActionLoadingOverlay active={isPending} label="Saving profile…" />
    </div>
  );
}
