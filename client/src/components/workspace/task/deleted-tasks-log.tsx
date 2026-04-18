import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  clearDeletedTaskLogsMutationFn,
  getDeletedTaskLogsQueryFn,
} from "@/lib/api";
import {
  getAvatarColor,
  getAvatarFallbackText,
  formatStatusToEnum,
} from "@/lib/helper";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import { DeletedTaskLogType } from "@/types/api.type";
import {
  TaskPriorityEnum,
  TaskStatusEnum,
  TaskPriorityEnumType,
  TaskStatusEnumType,
} from "@/constant";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 15;

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ value }: { value: string }) {
  const key = formatStatusToEnum(value) as TaskStatusEnumType;
  return (
    <Badge
      variant={TaskStatusEnum[key]}
      className="text-[11px] px-1.5 py-0.5 font-medium uppercase border-0 shadow-sm"
    >
      {value.replace(/_/g, " ")}
    </Badge>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const key = formatStatusToEnum(value) as TaskPriorityEnumType;
  return (
    <Badge
      variant={TaskPriorityEnum[key]}
      className="text-[11px] px-1.5 py-0.5 font-medium uppercase border-0 !bg-transparent !shadow-none"
    >
      {value}
    </Badge>
  );
}

function UserCell({
  user,
}: {
  user?: { _id: string; name: string; profilePicture?: string | null } | null;
}) {
  if (!user) return <span className="text-muted-foreground text-xs">—</span>;
  const initials = getAvatarFallbackText(user.name);
  const color = getAvatarColor(user.name);
  return (
    <div className="flex items-center gap-1.5">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={user.profilePicture ?? ""} alt={user.name} />
        <AvatarFallback className={`${color} text-[10px]`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm truncate max-w-[100px]">{user.name}</span>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function LogRow({ log }: { log: DeletedTaskLogType }) {
  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      {/* Task */}
      <TableCell className="py-2.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] h-[20px] shrink-0 font-mono"
            >
              {log.taskCode}
            </Badge>
            <span className="text-sm font-medium truncate max-w-[200px]">
              {log.title}
            </span>
          </div>
          {log.project && (
            <span className="text-xs text-muted-foreground">
              {log.project.emoji} {log.project.name}
            </span>
          )}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-2.5">
        <StatusBadge value={log.status} />
      </TableCell>

      {/* Priority */}
      <TableCell className="py-2.5">
        <PriorityBadge value={log.priority} />
      </TableCell>

      {/* Assigned to */}
      <TableCell className="py-2.5">
        <UserCell user={log.assignedTo} />
      </TableCell>

      {/* Deleted by */}
      <TableCell className="py-2.5">
        <UserCell user={log.deletedBy} />
      </TableCell>

      {/* Deleted at */}
      <TableCell className="py-2.5 text-sm text-muted-foreground whitespace-nowrap">
        {format(new Date(log.deletedAt), "dd MMM yyyy, HH:mm")}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DeletedTasksLog() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthContext();
  const canClear = hasPermission("DELETE_TASK"); // OWNER & ADMIN only

  const [pageNumber, setPageNumber] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deleted-task-logs", workspaceId, pageNumber],
    queryFn: () =>
      getDeletedTaskLogsQueryFn({
        workspaceId,
        pageSize: PAGE_SIZE,
        pageNumber,
      }),
    staleTime: 30_000,
  });

  const { mutate: clearLogs, isPending: isClearing } = useMutation({
    mutationFn: clearDeletedTaskLogsMutationFn,
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["deleted-task-logs", workspaceId],
      });
      setPageNumber(1);
      setShowClearConfirm(false);
      toast({
        title: "Log cleared",
        description: res.message,
        variant: "success",
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to clear log.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const handleClear = () => clearLogs({ workspaceId });

  const logs = data?.logs ?? [];
  const totalCount = data?.pagination.totalCount ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <History className="h-4 w-4" />
          Deletion Log
          {totalCount > 0 && (
            <span className="ml-0.5 rounded-full bg-destructive/15 text-destructive text-xs px-1.5 py-0 font-semibold">
              {totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-destructive shrink-0" />
                Deletion Audit Log
              </SheetTitle>
              <SheetDescription className="mt-1">
                A full history of every task deleted in this workspace.
                {totalCount > 0 && (
                  <span className="ml-1 font-medium text-foreground">
                    {totalCount} record{totalCount !== 1 ? "s" : ""} found.
                  </span>
                )}
              </SheetDescription>
            </div>

            {/* ── Clear all button / inline confirmation ── */}
            {canClear && logs.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                {!showClearConfirm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isClearing}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="text-xs font-medium text-destructive">
                      Clear all {totalCount} log{totalCount !== 1 ? "s" : ""}?
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      disabled={isClearing}
                      onClick={handleClear}
                    >
                      {isClearing ? "Clearing…" : "Yes, clear"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={isClearing}
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm animate-pulse">
              Loading deletion history…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Failed to load deletion log.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <History className="h-10 w-10 opacity-30" />
              <p className="text-sm">No tasks have been deleted yet.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2 font-semibold">Task</TableHead>
                    <TableHead className="py-2 font-semibold">Status</TableHead>
                    <TableHead className="py-2 font-semibold">Priority</TableHead>
                    <TableHead className="py-2 font-semibold">Assigned To</TableHead>
                    <TableHead className="py-2 font-semibold">Deleted By</TableHead>
                    <TableHead className="py-2 font-semibold">Deleted At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <LogRow key={log._id} log={log} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30 shrink-0">
            <span className="text-xs text-muted-foreground">
              Page {pageNumber} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
