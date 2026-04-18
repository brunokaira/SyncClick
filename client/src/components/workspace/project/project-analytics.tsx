import { useParams } from "react-router-dom";
import AnalyticsCard from "../common/analytics-card";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import { getProjectAnalyticsQueryFn } from "@/lib/api";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ProjectAnalytics = () => {
  const { projectId } = useParams() as { projectId: string };
  const workspaceId = useWorkspaceId();

  const { data, isPending } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => getProjectAnalyticsQueryFn({ workspaceId, projectId }),
    staleTime: 0,
    enabled: !!projectId,
  });

  const analytics = data?.analytics;

  return (
    <div className="space-y-4">
      {!isPending && analytics?.estimatedCompletionDate && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between",
            analytics.isBottleneckRisk
              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
              : "border-border bg-background"
          )}
        >
          <div>
            <h3 className="font-semibold text-lg">Sprint Forecast</h3>
            <p className="text-sm text-muted-foreground">
              Est. Completion:{" "}
              <span className="font-bold text-foreground">
                {format(new Date(analytics.estimatedCompletionDate), "PPP")}
              </span>
            </p>
          </div>

          {analytics.isBottleneckRisk && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg text-sm font-semibold">
              <AlertTriangle className="w-5 h-5" />
              High Bottleneck Risk
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard
          isLoading={isPending}
          title="Total Task"
          value={analytics?.totalTasks || 0}
        />
        <AnalyticsCard
          isLoading={isPending}
          title="Overdue Task"
          value={analytics?.overdueTasks || 0}
        />
        <AnalyticsCard
          isLoading={isPending}
          title="Completed Task"
          value={analytics?.completedTasks || 0}
        />
      </div>
    </div>
  );
};

export default ProjectAnalytics;