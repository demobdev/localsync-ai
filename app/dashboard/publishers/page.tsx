import { InfoIcon } from "lucide-react";

import { listPublishersAction } from "@/app/actions/locations";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const railLabels = {
  api: "API",
  guided_import: "Guided import",
  manual: "Manual",
  audit_only: "Audit only",
} as const;

const railExplanations = {
  api: "Direct API connection — we read (and eventually write) listing data programmatically. The strongest rail.",
  guided_import:
    "No public write API. We generate step-by-step import instructions using this publisher's own bulk/import tools.",
  manual:
    "Updates require logging into the publisher directly. We create per-field checklists so nothing is missed.",
  audit_only:
    "We crawl the public listing and flag inconsistencies against your master profile. No write path exists today.",
} as const;

function checklistPreview(markdown: string | null): string[] {
  if (!markdown) {
    return [];
  }

  return markdown
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

export default async function PublishersPage() {
  const publishers = await listPublishersAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Publisher registry</h1>
        <p className="text-muted-foreground">
          Every destination is typed honestly — no pretend syndication. Hover a
          card for how each rail works.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {publishers.map((publisher) => {
          const steps = checklistPreview(publisher.checklistMarkdown);

          return (
            <Tooltip key={publisher.id}>
              <TooltipTrigger
                render={
                  <Card className="cursor-help transition-colors hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <PublisherIcon
                            slug={publisher.slug}
                            badge
                            size={30}
                          />
                          <div className="min-w-0">
                            <CardTitle className="flex items-center gap-1.5">
                              {publisher.name}
                              <InfoIcon className="size-3.5 shrink-0 text-muted-foreground/50" />
                            </CardTitle>
                            <CardDescription>
                              {publisher.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className="shrink-0">
                          {railLabels[publisher.rail]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {publisher.websiteUrl ? (
                        <p className="truncate">{publisher.websiteUrl}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {publisher.isCore ? (
                          <Badge variant="outline">Core</Badge>
                        ) : null}
                        {publisher.isHomeServices ? (
                          <Badge variant="outline">Home services</Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                }
              />
              <TooltipContent
                side="bottom"
                className="max-w-sm space-y-2 p-3 text-left"
              >
                <p className="font-semibold">
                  {railLabels[publisher.rail]} rail
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {railExplanations[publisher.rail]}
                </p>
                {steps.length > 0 ? (
                  <div>
                    <p className="mt-1 text-xs font-semibold">
                      Update checklist:
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs opacity-90">
                      {steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
