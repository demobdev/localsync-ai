"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  approveFaqDraftAction,
  generateFaqDraftAction,
  rejectFaqDraftAction,
} from "@/app/actions/approvals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LocationFaq } from "@/lib/types/location-profile";

type PendingDraft = {
  id: string;
  faqs: LocationFaq[];
  createdAt: Date;
};

export function FaqApprovalPanel({
  locationId,
  approvedFaqs,
  pendingDrafts,
}: {
  locationId: string;
  approvedFaqs: LocationFaq[];
  pendingDrafts: PendingDraft[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  return (
    <Card className="localmap-card-glow">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>FAQ drafts</CardTitle>
          <CardDescription>
            AI suggests FAQs — you approve before they appear on your public page
            and schema.org data.
          </CardDescription>
        </div>
        <Button
          disabled={isPending || pendingDrafts.length > 0}
          onClick={() =>
            run(
              () => generateFaqDraftAction(locationId),
              "FAQ draft ready for review",
            )
          }
        >
          Generate FAQ draft
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvedFaqs.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">
              Approved FAQs ({approvedFaqs.length})
            </p>
            <ul className="space-y-2 text-sm">
              {approvedFaqs.map((faq) => (
                <li key={faq.question} className="rounded-xl border p-3">
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 text-muted-foreground">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No approved FAQs yet. Generate a draft to improve AI discoverability.
          </p>
        )}

        {pendingDrafts.map((draft) => (
          <div
            key={draft.id}
            className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Pending review</p>
              <Badge variant="secondary">Draft</Badge>
            </div>
            <ul className="space-y-2 text-sm">
              {draft.faqs.map((faq) => (
                <li key={faq.question} className="rounded-lg border bg-background p-3">
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 text-muted-foreground">{faq.answer}</p>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isPending}
                onClick={() =>
                  run(
                    () => approveFaqDraftAction(draft.id),
                    "FAQs approved and page updated",
                  )
                }
              >
                Approve all
              </Button>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  run(
                    () => rejectFaqDraftAction(draft.id),
                    "Draft rejected",
                  )
                }
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
