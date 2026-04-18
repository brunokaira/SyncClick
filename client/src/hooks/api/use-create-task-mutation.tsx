import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTaskMutationFn } from "@/lib/api";
import { CreateTaskPayloadType } from "@/types/api.type";
import { useToast } from "../use-toast";

const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateTaskPayloadType) => createTaskMutationFn(payload),
    onSuccess: (_, variables) => {
      // Invalidate queries to instantly refresh the UI for the creator
      // Note: "all-tasks" is the key used by TaskTable and RecentTasks
      queryClient.invalidateQueries({
        queryKey: ["all-tasks", variables.workspaceId],
      });
      // Also cover the legacy key just in case
      queryClient.invalidateQueries({
        queryKey: ["allTasks", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectAnalytics", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace-analytics", variables.workspaceId],
      });
      toast({ title: "Task created successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create task", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
};

export default useCreateTaskMutation;