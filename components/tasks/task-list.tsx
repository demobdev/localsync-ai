"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ListChecksIcon,
  SparklesIcon,
} from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateTaskStatusAction } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fixQueuePriority,
  fixQueueSource,
  fixQueueSourceLabel,
  isNewFixQueueTask,
  sortFixQueueTasks,
  type FixQueuePriority,
  type FixQueueStatus,
} from "@/lib/tasks/fix-queue";
import { cn } from "@/lib/utils";

type TaskRow = {
  id: string;
  locationId: string;
  locationName: string;
  publisherName: string;
  title: string;
  description: string | null;
  status: FixQueueStatus;
  checklistItemKey: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

const statusLabels: Record<FixQueueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Completed",
  blocked: "Waiting",
};

const priorityMeta: Record<
  FixQueuePriority,
  { label: string; className: string; rail: string }
> = {
  urgent: {
    label: "Urgent",
    className:
      "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    rail: "bg-rose-500",
  },
  next: {
    label: "Recommended",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    rail: "bg-amber-400",
  },
  routine: {
    label: "Routine",
    className:
      "border-slate-500/25 bg-slate-500/8 text-slate-600 dark:text-slate-300",
    rail: "bg-slate-300 dark:bg-slate-600",
  },
};

function FixQueueRow({
  task,
  isPending,
  onStatusChange,
}: {
  task: TaskRow;
  isPending: boolean;
  onStatusChange: (taskId: string, status: FixQueueStatus) => void;
}) {
  const priority = fixQueuePriority(task);
  const priorityUi = priorityMeta[priority];
  const source = fixQueueSource(task);

  return (
    <div className="relative overflow-hidden border-b border-border/70 px-4 py-4 last:border-b-0 sm:px-5">
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", priorityUi.rail)}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 pl-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{task.title}</p>
            <Badge variant="outline" className={priorityUi.className}>
              {priorityUi.label}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {fixQueueSourceLabel(source)}
            </Badge>
            {isNewFixQueueTask(task) ? (
              <Badge className="bg-primary text-primary-foreground">New</Badge>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            <Link
              href={"/dashboard/locations/" + task.locationId}
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
            >
              {task.locationName}
            </Link>
            {" · "}
            {task.publisherName}
          </p>
          {task.description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>

        <Select
          value={task.status}
          onValueChange={(value) =>
            value && onStatusChange(task.id, value as FixQueueStatus)
          }
          disabled={isPending}
        >
          <SelectTrigger
            className="w-full shrink-0 bg-background sm:w-36"
            aria-label={"Update " + task.title}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: TaskRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const orderedTasks = sortFixQueueTasks(tasks);
  const activeTasks = orderedTasks.filter((task) => task.status !== "done");
  const doneTasks = orderedTasks.filter((task) => task.status === "done");
  const urgentCount = activeTasks.filter(
    (task) => fixQueuePriority(task) === "urgent",
  ).length;
  const inProgressCount = activeTasks.filter(
    (task) => task.status === "in_progress",
  ).length;

  function setStatus(taskId: string, status: FixQueueStatus) {
    startTransition(async () => {
      try {
        await updateTaskStatusAction({ taskId, status });
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update task",
        );
      }
    });
  }

  const summary = [
    {
      label: "Urgent",
      value: urgentCount,
      detail: "Auth, verification, rejection, or blocked",
      icon: AlertTriangleIcon,
      tone: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "In progress",
      value: inProgressCount,
      detail: "Work someone has started",
      icon: CircleDotIcon,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Open",
      value: activeTasks.length,
      detail: "Everything still requiring a person",
      icon: ListChecksIcon,
      tone: "text-primary",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="border-b p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <item.icon className={cn("size-4", item.tone)} />
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {activeTasks.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>
              Sorted by operational risk first, then by recency.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activeTasks.map((task) => (
              <FixQueueRow
                key={task.id}
                task={task}
                isPending={isPending}
                onStatusChange={setStatus}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 px-6 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <SparklesIcon className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">The queue is clear.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Audit findings and publisher steps will appear here whenever a
            person needs to make a decision or finish the work.
          </p>
        </div>
      )}

      {doneTasks.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-5 text-primary" />
              <CardTitle>Recently completed ({doneTasks.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {doneTasks.slice(0, 8).map((task) => (
              <div
                key={task.id}
                className="rounded-xl border bg-muted/20 px-3 py-2.5 text-sm"
              >
                <p className="truncate font-medium line-through decoration-muted-foreground/40">
                  {task.title}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {task.locationName} · {task.publisherName}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
