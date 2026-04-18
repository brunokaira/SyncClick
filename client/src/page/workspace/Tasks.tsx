import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import DeletedTasksLog from "@/components/workspace/task/deleted-tasks-log";

export default function Tasks() {
  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        {/* Actions row */}
        <div className="flex items-center gap-2">
          <DeletedTasksLog />
          <CreateTaskDialog />
        </div>
      </div>
      {/* Task Table */}
      <div>
        <TaskTable />
      </div>
    </div>
  );
}
