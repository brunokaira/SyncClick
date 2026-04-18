import { useQuery } from "@tanstack/react-query";
import { getProjectAnalyticsQueryFn } from "@/lib/api";
import { CustomError } from "@/types/custom-error.type";
import { AnalyticsResponseType } from "@/types/api.type"; // <-- Import the exact type

const useGetProjectAnalyticsQuery = (
  workspaceId: string,
  projectId: string
) => {
  // Replace 'any' with 'AnalyticsResponseType'
  const query = useQuery<AnalyticsResponseType, CustomError>({
    queryKey: ["projectAnalytics", workspaceId, projectId],
    queryFn: () => getProjectAnalyticsQueryFn({ workspaceId, projectId }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    enabled: !!workspaceId && !!projectId,
  });

  return query;
};

export default useGetProjectAnalyticsQuery;