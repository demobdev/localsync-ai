import { OrganizationProfile } from "@clerk/nextjs";
import { UsersIcon } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <UsersIcon className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Team</h1>
            <p className="text-muted-foreground">
              Invite teammates, manage roles, and update your workspace name
              and logo.
            </p>
          </div>
        </div>
      </div>

      <OrganizationProfile
        routing="path"
        path="/dashboard/team"
        afterLeaveOrganizationUrl="/dashboard/onboarding"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox:
              "w-full max-w-none rounded-2xl border border-border shadow-none localmap-card-glow bg-card",
            navbar:
              "bg-muted/30 border-r border-border [&_h1]:text-foreground",
            scrollBox: "bg-card rounded-none",
            pageScrollBox: "px-6 py-6",
          },
        }}
      />
    </div>
  );
}
