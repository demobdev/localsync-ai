"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Finding = {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  masterValue: string | null;
  foundValue: string | null;
};

type Evidence = {
  id: string;
  publisherName: string | null;
  sourceUrl: string;
  extractedData: Record<string, unknown> | null;
};

const severityOrder = ["critical", "warning", "info"] as const;
const severityLabels = {
  critical: "Critical",
  warning: "Warnings",
  info: "Info",
} as const;
const severityVariants = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
} as const;

export function AuditFindingsPanel({
  findings,
  evidence,
}: {
  findings: Finding[];
  evidence: Evidence[];
}) {
  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  return (
    <div className="space-y-6">
      {findings.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {severityOrder.map((severity) =>
            counts[severity] > 0 ? (
              <Badge key={severity} variant={severityVariants[severity]}>
                {counts[severity]} {severityLabels[severity].toLowerCase()}
              </Badge>
            ) : null,
          )}
        </div>
      ) : null}

      {severityOrder.map((severity) => {
        const group = findings.filter((f) => f.severity === severity);
        if (group.length === 0) {
          return null;
        }

        return (
          <Card key={severity} className="localmap-card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{severityLabels[severity]}</CardTitle>
              <CardDescription>
                {group.length} finding{group.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.map((finding) => (
                <div key={finding.id} className="rounded-xl border p-3">
                  <p className="font-medium">{finding.message}</p>
                  {finding.masterValue || finding.foundValue ? (
                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Master profile</p>
                        <p>{finding.masterValue ?? "—"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Found on listing</p>
                        <p>{finding.foundValue ?? "—"}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {findings.length === 0 ? (
        <Card className="localmap-card-glow">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No findings — all audited listings match the master profile.
          </CardContent>
        </Card>
      ) : null}

      <Card className="localmap-card-glow">
        <CardHeader>
          <CardTitle>Evidence ({evidence.length})</CardTitle>
          <CardDescription>
            Raw extraction from each crawled listing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceRow({ item }: { item: Evidence }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{item.publisherName ?? "Unknown publisher"}</p>
        <Link
          href={item.sourceUrl}
          target="_blank"
          className="shrink-0 text-sm text-primary underline-offset-4 hover:underline"
        >
          View listing
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
        {open ? "Hide" : "View"} raw extraction
      </button>
      {open ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-2 text-xs">
          {JSON.stringify(item.extractedData, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
