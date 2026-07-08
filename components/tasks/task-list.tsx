"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

type TaskStatus = "open" | "in_progress" | "done" | "blocked";

type TaskRow = {
  id: string;
  locationId: string;
  locationName: string;
  publisherName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  checklistItemKey: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

const statusLabels: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

const statusVariants: Record<
  TaskStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "outline",
  in_progress: "secondary",
  done: "default",
  blocked: "destructive",
};

function isGraderTask(task: TaskRow) {
  return task.checklistItemKey?.startsWith("grader:") ?? false;
}

function TaskRowCard({
  task,
  isPending,
  onStatusChange,
}: {
  task: TaskRow;
  isPending: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{task.title}</p>
          {isGraderTask(task) ? (
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
            >
              Visibility audit
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/dashboard/locations/${task.locationId}`}
            className="underline underline-offset-4"
          >
            {task.locationName}
          </Link>
          {" · "}
          {task.publisherName}
        </p>
        {task.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusVariants[task.status]}>
          {statusLabels[task.status]}
        </Badge>
        <Select
          value={task.status}
          onValueChange={(value) =>
            value && onStatusChange(task.id, value as TaskStatus)
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-36">
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

  function setStatus(taskId: string, status: TaskStatus) {
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

  const openTasks = tasks.filter((task) => task.status !== "done");
  const graderOpenTasks = openTasks.filter(isGraderTask);
  const otherOpenTasks = openTasks.filter((task) => !isGraderTask(task));
  const doneTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-6">
      {graderOpenTasks.length > 0 ? (
        <Card className="localmap-card-glow border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle>
              From visibility audit ({graderOpenTasks.length})
            </CardTitle>
            <CardDescription>
              Quick wins queued automatically when you claim or re-run a grader
              audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {graderOpenTasks.map((task) => (
              <TaskRowCard
                key={task.id}
                task={task}
                isPending={isPending}
                onStatusChange={setStatus}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {otherOpenTasks.length > 0
              ? `Other open tasks (${otherOpenTasks.length})`
              : `Open tasks (${openTasks.length})`}
          </CardTitle>
          <CardDescription>
            Manual work per publisher — the honest rail for destinations without
            APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open tasks. Claim a grader audit or create per-publisher
              checklists from a location&apos;s Listings tab.
            </p>
          ) : otherOpenTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All open tasks are from your visibility audit above.
            </p>
          ) : (
            otherOpenTasks.map((task) => (
              <TaskRowCard
                key={task.id}
                task={task}
                isPending={isPending}
                onStatusChange={setStatus}
              />
            ))
          )}
        </CardContent>
      </Card>

      {doneTasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Completed ({doneTasks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {doneTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-muted-foreground"
              >
                <span className="line-through">{task.title}</span>
                <span>
                  {task.locationName} · {task.publisherName}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
