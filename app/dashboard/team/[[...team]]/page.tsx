import { OrganizationProfile } from "@clerk/nextjs";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Team</h1>
        <p className="text-muted-foreground">
          Invite teammates, manage roles, and control who can access this
          workspace.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card localmap-card-glow">
        <OrganizationProfile
          routing="path"
          path="/dashboard/team"
          afterLeaveOrganizationUrl="/dashboard/onboarding"
        />
      </div>
    </div>
  );
}
