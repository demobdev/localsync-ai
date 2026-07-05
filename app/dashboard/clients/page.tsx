import { listClientsAction } from "@/app/actions/locations";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClientsPage() {
  const clients = await listClientsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">
            Agencies manage multiple end-customers from one organization.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients.length === 0 ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>No clients yet</CardTitle>
              <CardDescription>
                Create your first client to start adding locations.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle>{client.name}</CardTitle>
                <CardDescription>{client.slug}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {client.contactEmail ? <p>{client.contactEmail}</p> : null}
                {client.contactPhone ? <p>{client.contactPhone}</p> : null}
                {client.notes ? <p>{client.notes}</p> : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
