import Link from "next/link";
import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuditAlreadyClaimedCard({
  auditId,
  businessName,
}: {
  auditId: string;
  businessName: string | null;
}) {
  return (
    <Card className="localmap-card-glow border-amber-200/80">
      <CardHeader>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircleIcon className="size-5" />
          <CardTitle>Audit already linked</CardTitle>
        </div>
        <CardDescription>
          {businessName
            ? `The visibility audit for ${businessName} is already connected to another LocalSync workspace.`
            : "This visibility audit is already connected to another LocalSync workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link href={`/grader/${auditId}`} />}>
          View audit report
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/grader" />}
        >
          Run a new audit
        </Button>
      </CardContent>
    </Card>
  );
}
