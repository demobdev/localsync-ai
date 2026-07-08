import { listTasksAction } from "@/app/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage() {
  const tasks = await listTasksAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Fix queue</h1>
        <p className="text-muted-foreground">
          Visibility audit quick wins and manual publisher checklists — work
          through leaks, then track listing updates.
        </p>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}
