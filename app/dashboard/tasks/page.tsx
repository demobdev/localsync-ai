import { ShieldAlertIcon } from "lucide-react";

import { listTasksAction } from "@/app/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";
import { Badge } from "@/components/ui/badge";

export default async function TasksPage() {
  const tasks = await listTasksAction();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#082b3a] p-6 text-white sm:p-8">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#20c9b5]/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge className="border-[#65dfd0]/35 bg-[#65dfd0]/12 text-[#9ff3e8]">
            <ShieldAlertIcon className="mr-1.5 size-3.5" />
            Human action only
          </Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Fix queue
          </h1>
          <p className="mt-2 leading-relaxed text-white/65">
            One prioritized queue for anything LocalMap cannot safely finish
            alone: approvals, verification, authentication, publisher
            exceptions, and evidence-backed audit fixes.
          </p>
        </div>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}
