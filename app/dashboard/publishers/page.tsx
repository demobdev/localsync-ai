import { listPublishersAction } from "@/app/actions/locations";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const railLabels = {
  api: "API",
  guided_import: "Guided import",
  manual: "Manual",
  audit_only: "Audit only",
} as const;

export default async function PublishersPage() {
  const publishers = await listPublishersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Publisher registry</h1>
        <p className="text-muted-foreground">
          Every destination is typed honestly — no pretend syndication.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {publishers.map((publisher) => (
          <Card key={publisher.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{publisher.name}</CardTitle>
                  <CardDescription>{publisher.description}</CardDescription>
                </div>
                <Badge>{railLabels[publisher.rail]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {publisher.websiteUrl ? (
                <p>{publisher.websiteUrl}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {publisher.isCore ? <Badge variant="outline">Core</Badge> : null}
                {publisher.isHomeServices ? (
                  <Badge variant="outline">Home services</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
