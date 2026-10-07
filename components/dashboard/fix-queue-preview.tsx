import Link from "next/link";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ListChecksIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fixQueuePriority,
  isNewFixQueueTask,
  sortFixQueueTasks,
  type FixQueueStatus,
} from "@/lib/tasks/fix-queue";
import { cn } from "@/lib/utils";

type PreviewTask = {
  id: string;
  locationId: string;
  locationName: string;
  publisherName: string;
  title: string;
  description: string | null;
  status: FixQueueStatus;
  checklistItemKey: string | null;
  createdAt: Date;
};

export function FixQueuePreview({
  tasks,
  className,
}: {
  tasks: PreviewTask[];
  className?: string;
}) {
  const active = sortFixQueueTasks(tasks).filter(
    (task) => task.status !== "done",
  );
  const urgentCount = active.filter(
    (task) => fixQueuePriority(task) === "urgent",
  ).length;

  return (
    <Card className={cn("localmap-card-glow overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Fix queue</CardTitle>
              <Badge
                variant={urgentCount > 0 ? "destructive" : "secondary"}
              >
                {urgentCount > 0
                  ? urgentCount + " urgent"
                  : active.length + " open"}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Only the work that requires a person.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/tasks" />}
          >
            View all
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {active.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2Icon className="size-5" />
            </span>
            <p className="mt-3 font-medium">Nothing needs you right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New audit findings and publisher work will appear here.
            </p>
          </div>
        ) : (
          active.slice(0, 4).map((task) => {
            const urgent = fixQueuePriority(task) === "urgent";
            return (
              <Link
                key={task.id}
                href="/dashboard/tasks"
                className="group relative block border-b px-5 py-4 last:border-b-0 hover:bg-muted/35"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    urgent ? "bg-rose-500" : "bg-primary/35",
                  )}
                />
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                      urgent
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {urgent ? (
                      <AlertTriangleIcon className="size-4" />
                    ) : (
                      <ListChecksIcon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium group-hover:text-primary">
                        {task.title}
                      </span>
                      {isNewFixQueueTask(task) ? (
                        <Badge className="h-5 px-1.5 text-[10px]">New</Badge>
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {task.locationName} · {task.publisherName}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
