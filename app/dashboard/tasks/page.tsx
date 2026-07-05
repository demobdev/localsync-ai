import { listTasksAction } from "@/app/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage() {
  const tasks = await listTasksAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Manual tasks</h1>
        <p className="text-muted-foreground">
          Per-publisher checklists for destinations that require manual updates.
          Create them from a location&apos;s Listings &amp; Audits tab.
        </p>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}
