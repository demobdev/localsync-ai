import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Manual tasks</h1>
        <p className="text-muted-foreground">
          Per-publisher checklists arrive in Sprint 2 with the audit engine.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming in Sprint 2</CardTitle>
          <CardDescription>
            Manual-task tracker with publisher-specific checklists and audit
            findings will populate this view.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
