export type FixQueueStatus = "open" | "in_progress" | "done" | "blocked";
export type FixQueuePriority = "urgent" | "next" | "routine";
export type FixQueueSource = "system" | "visibility_audit" | "publisher";

export type FixQueueTaskLike = {
  title: string;
  description: string | null;
  status: FixQueueStatus;
  checklistItemKey: string | null;
  createdAt: Date | string;
};

const URGENT_SIGNAL =
  /\b(authentication|reconnect|expired|verification|required|rejected|duplicate|conflict|failed|failure|error|suppress|suspension)\b/i;

export function fixQueueSource(task: FixQueueTaskLike): FixQueueSource {
  if (task.checklistItemKey?.startsWith("grader:")) {
    return "visibility_audit";
  }

  if (task.checklistItemKey?.startsWith("system:")) {
    return "system";
  }

  return "publisher";
}

export function fixQueuePriority(
  task: FixQueueTaskLike,
): FixQueuePriority {
  if (task.status === "blocked") return "urgent";

  const searchable = [task.title, task.description ?? ""].join(" ");
  if (URGENT_SIGNAL.test(searchable)) return "urgent";
  if (
    task.status === "in_progress" ||
    fixQueueSource(task) === "visibility_audit"
  ) {
    return "next";
  }

  return "routine";
}

export function isNewFixQueueTask(
  task: FixQueueTaskLike,
  now = new Date(),
): boolean {
  if (task.status === "done") return false;

  const createdAt = new Date(task.createdAt);
  if (Number.isNaN(createdAt.getTime())) return false;

  const ageMs = now.getTime() - createdAt.getTime();
  return ageMs >= 0 && ageMs <= 72 * 60 * 60 * 1000;
}

const PRIORITY_RANK: Record<FixQueuePriority, number> = {
  urgent: 0,
  next: 1,
  routine: 2,
};

const STATUS_RANK: Record<FixQueueStatus, number> = {
  blocked: 0,
  in_progress: 1,
  open: 2,
  done: 3,
};

export function sortFixQueueTasks<T extends FixQueueTaskLike>(
  tasks: readonly T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const priorityDelta =
      PRIORITY_RANK[fixQueuePriority(a)] -
      PRIORITY_RANK[fixQueuePriority(b)];
    if (priorityDelta !== 0) return priorityDelta;

    const statusDelta = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (statusDelta !== 0) return statusDelta;

    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

export function fixQueueSourceLabel(source: FixQueueSource): string {
  switch (source) {
    case "system":
      return "System alert";
    case "visibility_audit":
      return "Visibility audit";
    case "publisher":
      return "Publisher work";
  }
}
