"use client";

import { useRef, useState } from "react";

import { LocationProfileEditor } from "@/components/locations/location-profile-editor";
import { ProfileSetupGuide } from "@/components/locations/profile-setup-guide";
import type { SetupProgress } from "@/lib/profile/setup-workflow";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import type { listLocationVersionsAction } from "@/app/actions/locations";

type Taxonomy = {
  categories: Array<{ slug: string; name: string }>;
  services: Array<{ slug: string; name: string; categorySlug: string }>;
};

type VersionRow = Awaited<
  ReturnType<typeof listLocationVersionsAction>
>[number];

const VALID_TABS = new Set([
  "nap",
  "hours",
  "services",
  "attributes",
  "photos",
  "links",
]);

export function LocationProfileView({
  locationId,
  initialProfile,
  taxonomy,
  initialVersions,
  setupProgress,
  defaultTab = "nap",
}: {
  locationId: string;
  initialProfile: LocationProfileSnapshot;
  taxonomy: Taxonomy;
  initialVersions: VersionRow[];
  setupProgress: SetupProgress;
  defaultTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.has(defaultTab) ? defaultTab : "nap",
  );
  const editorRef = useRef<HTMLDivElement>(null);

  function goToTab(tab: string) {
    setActiveTab(tab);
    // The editor sits below the setup guide; without scrolling, clicking
    // "Go" appears to do nothing.
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-6">
      <ProfileSetupGuide
        progress={setupProgress}
        onProfileTab={(tab) => goToTab(tab)}
      />
      <div ref={editorRef} className="scroll-mt-20">
        <LocationProfileEditor
          locationId={locationId}
          initialProfile={initialProfile}
          taxonomy={taxonomy}
          initialVersions={initialVersions}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
