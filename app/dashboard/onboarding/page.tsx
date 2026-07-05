import { CreateOrganization } from "@clerk/nextjs";

export default function DashboardOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Create or join an organization</h1>
        <p className="mt-2 text-muted-foreground">
          LocalSync uses Clerk organizations for agencies and client workspaces.
          Create one to start managing locations.
        </p>
      </div>
      <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
    </div>
  );
}
