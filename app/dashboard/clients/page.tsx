import Link from "next/link";
import { ArrowRightIcon, FileBarChart2Icon } from "lucide-react";

import { listClientsWithLocationAuditsAction } from "@/app/actions/locations";
import { ClientAuditPanel } from "@/components/clients/client-audit-panel";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClientsPage() {
  const clients = await listClientsWithLocationAuditsAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">
            Run visibility audits per client location and track score changes
            over time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/grader" />}
          >
            <FileBarChart2Icon className="size-4" />
            New prospect audit
          </Button>
          <CreateClientDialog />
        </div>
      </div>

      <div className="grid gap-4">
        {clients.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No clients yet</CardTitle>
              <CardDescription>
                Create your first client to start adding locations and running
                audits.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="localmap-card-glow">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>{client.slug}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/dashboard/locations" />}
                >
                  All locations
                  <ArrowRightIcon className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(client.contactEmail || client.contactPhone || client.notes) && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {client.contactEmail ? <p>{client.contactEmail}</p> : null}
                    {client.contactPhone ? <p>{client.contactPhone}</p> : null}
                    {client.notes ? <p>{client.notes}</p> : null}
                  </div>
                )}
                <ClientAuditPanel locations={client.locations} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
