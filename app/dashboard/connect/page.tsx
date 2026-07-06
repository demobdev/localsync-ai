import { getPrimaryLocationSetupAction } from "@/app/actions/setup-progress";
import { getGoogleImportStateAction } from "@/app/actions/google-import";
import { ConnectionsHub } from "@/components/connect/connections-hub";

export default async function ConnectPage() {
  const [{ progress, locationId }, googleState] = await Promise.all([
    getPrimaryLocationSetupAction(),
    getGoogleImportStateAction(),
  ]);

  return (
    <ConnectionsHub
      googleState={googleState}
      setupProgress={progress}
      primaryLocationId={locationId}
    />
  );
}
