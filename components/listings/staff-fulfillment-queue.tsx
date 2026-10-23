import { AlertTriangleIcon, ArrowRightIcon, ClipboardCheckIcon, Clock3Icon, UserRoundIcon } from "lucide-react";
import {
  claimStaffFulfillmentCaseAction,
  requestStaffFulfillmentInformationAction,
  resumeStaffFulfillmentCaseAction,
} from "@/app/actions/staff-fulfillment";
import type { StaffFulfillmentCase } from "@/lib/listings/staff-fulfillment.server";

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC`;
}

const status = {
  needs_review: { label: "Needs review", tone: "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-200" },
  in_progress: { label: "In progress", tone: "bg-blue-100 text-blue-950 dark:bg-blue-950/50 dark:text-blue-200" },
  needs_information: { label: "Needs information", tone: "bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-200" },
};

export function StaffFulfillmentQueue({ cases, staffUserId }: { cases: StaffFulfillmentCase[]; staffUserId: string }) {
  return <main className="mx-auto min-w-0 max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase text-primary">Internal operations / Listings</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Publisher handoffs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review and assign manual publisher work. This queue does not submit listings or mark them verified.</p></div>
      <p className="inline-flex min-h-10 items-center gap-2 border px-3 text-sm"><UserRoundIcon aria-hidden="true" className="size-4 text-muted-foreground" />Internal staff</p>
    </header>

    <div role="note" className="flex items-start gap-3 border-y border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>Operator review only. Record concise process notes; do not enter passwords, payment details, or unnecessary personal information. External submission and verification remain separate.</p>
    </div>

    <dl className="grid grid-cols-2 divide-x divide-y border sm:grid-cols-3 sm:divide-y-0">
      <div className="px-4 py-3 sm:px-5"><dt className="text-xs text-muted-foreground">Cases in queue</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{cases.length}</dd></div>
      <div className="px-4 py-3 sm:px-5"><dt className="text-xs text-muted-foreground">Needs review</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{cases.filter(item => item.staffReview.status === "needs_review").length}</dd></div>
      <div className="col-span-2 px-4 py-3 sm:col-span-1 sm:px-5"><dt className="text-xs text-muted-foreground">Waiting on owner information</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{cases.filter(item => item.staffReview.status === "needs_information").length}</dd></div>
    </dl>

    {cases.length === 0 ? <p className="border-y py-10 text-center text-sm text-muted-foreground">No manual publisher handoffs are waiting for LocalMap review.</p>
      : <ol className="divide-y border-y" aria-label="Manual publisher handoffs">
        {cases.map(item => {
          const current = status[item.staffReview.status];
          const assignedToMe = item.staffReview.assignedToUserId === staffUserId;
          const owner = item.staffReview.assignedToUserId ? assignedToMe ? "You" : "Another staff member" : "Unassigned";
          return <li key={item.attemptId} className="grid min-w-0 gap-5 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)]">
            <section className="min-w-0" aria-labelledby={`case-${item.attemptId}`}>
              <div className="flex flex-wrap items-center gap-2"><h2 id={`case-${item.attemptId}`} className="text-base font-semibold [overflow-wrap:anywhere]">{item.businessName}</h2>
                <span className="font-mono text-xs text-muted-foreground">{item.attemptId.slice(0, 8)}</span><span className={`rounded px-2 py-1 text-xs font-medium ${current.tone}`}>{current.label}</span></div>
              <p className="mt-2 text-sm text-muted-foreground">{item.publisherName} <span aria-hidden="true">·</span> {item.publisherSlug}</p>
              <p className="mt-4 text-xs text-muted-foreground">Added {dateTime(item.createdAt)} <span aria-hidden="true">·</span> Assigned to {owner}</p>
              {item.staffReview.lastNote && <p className="mt-3 max-w-2xl break-words border-l-2 px-3 py-2 text-sm">{item.staffReview.lastNote}</p>}
              <details className="mt-3 max-w-2xl">
                <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">Activity history ({item.events.length})</summary>
                {item.events.length ? <ol className="space-y-3 border-l pl-4">{item.events.map(event => <li key={event.id} className="relative before:absolute before:-left-[1.32rem] before:top-1.5 before:size-2 before:rounded-full before:bg-muted-foreground/50">
                  <p className="text-sm">{event.message}</p><p className="mt-1 text-xs text-muted-foreground">{event.actorUserId === staffUserId ? "You" : "Staff"} <span aria-hidden="true">·</span> {dateTime(event.at)}</p>
                </li>)}</ol> : <p className="py-2 text-sm text-muted-foreground">No operator actions recorded yet.</p>}
              </details>
            </section>

            <section className="min-w-0 border-t pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0" aria-label={`Actions for ${item.businessName}`}>
              {item.staffReview.status === "needs_review" && <form action={claimStaffFulfillmentCaseAction}>
                <input type="hidden" name="attemptId" value={item.attemptId} /><input type="hidden" name="expectedRevision" value={item.staffReview.revision} />
                <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-ring"><ClipboardCheckIcon aria-hidden="true" className="size-4" />Claim case</button>
              </form>}
              {item.staffReview.status === "in_progress" && (assignedToMe
                ? <form action={requestStaffFulfillmentInformationAction} className="space-y-2">
                    <input type="hidden" name="attemptId" value={item.attemptId} /><input type="hidden" name="expectedRevision" value={item.staffReview.revision} />
                    <label className="block text-xs text-muted-foreground">Owner information needed<textarea name="note" required maxLength={500} rows={3} placeholder="Describe what the owner needs to provide" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></label>
                    <button type="submit" className="min-h-10 rounded-md border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Mark waiting on owner</button>
                  </form>
                : <p className="text-sm text-muted-foreground">This case is assigned to another staff member.</p>)}
              {item.staffReview.status === "needs_information" && (assignedToMe
                ? <form action={resumeStaffFulfillmentCaseAction} className="space-y-2">
                    <input type="hidden" name="attemptId" value={item.attemptId} /><input type="hidden" name="expectedRevision" value={item.staffReview.revision} />
                    <label className="block text-xs text-muted-foreground">Information received<textarea name="note" required maxLength={500} rows={3} placeholder="Summarize what arrived" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring" /></label>
                    <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Resume work<ArrowRightIcon aria-hidden="true" className="size-4" /></button>
                  </form>
                : <p className="text-sm text-muted-foreground">This case is assigned to another staff member.</p>)}
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Clock3Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />Changes save with a revision and append to the routing event log. Publisher attempts stay unchanged.</p>
            </section>
          </li>;
        })}
      </ol>}
  </main>;
}
