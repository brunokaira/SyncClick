import { TaskPriorityEnum, TaskStatusEnum } from "../enums/task.enum";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import DeletedTaskLogModel from "../models/deleted-task-log.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const { title, description, priority, status, dueDate } = body;
  let { assignedTo } = body;

  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException("Project not found");
  }

  if (!assignedTo) {
    const bestDev = await TaskModel.aggregate([
      { $match: { project: project._id, status: TaskStatusEnum.DONE } },
      {
        $group: {
          _id: "$assignedTo",
          avgTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } },
        },
      },
      { $sort: { avgTime: 1 } },
      { $limit: 1 },
    ]);

    if (bestDev.length > 0 && bestDev[0]._id) {
      assignedTo = bestDev[0]._id.toString();
    }
  }

  if (assignedTo) {
    const isAssignedUserMember = await MemberModel.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }

  const task = new TaskModel({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: userId,
    workspace: workspaceId,
    project: projectId,
    dueDate,
  });

  await task.save();

  return { task };
};
export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await TaskModel.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  //Pagination Setup
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [tasks, totalCount] = await Promise.all([
    TaskModel.find(query)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture -password")
      .populate("project", "_id emoji name"),
    TaskModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    tasks,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  }).populate("assignedTo", "_id name profilePicture -password");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string,
  deletedByUserId: string
) => {
  // Fetch the task BEFORE deleting so we can store a full snapshot
  const task = await TaskModel.findOne({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  // ── Save deletion log ──────────────────────────────────────────
  await DeletedTaskLogModel.create({
    taskCode:    task.taskCode,
    title:       task.title,
    description: task.description ?? null,
    status:      task.status,
    priority:    task.priority,
    dueDate:     task.dueDate ?? null,
    workspace:   task.workspace,
    project:     task.project   ?? null,
    assignedTo:  task.assignedTo ?? null,
    createdBy:   task.createdBy,
    deletedBy:   deletedByUserId,
    deletedAt:   new Date(),
  });

  // ── Now hard-delete the task ────────────────────────────────────
  await task.deleteOne();

  return;
};

// ──────────────────────────────────────────────────────────────────
// GET DELETED TASK LOGS FOR A WORKSPACE
// ──────────────────────────────────────────────────────────────────
export const getDeletedTaskLogsService = async (
  workspaceId: string,
  pagination: { pageSize: number; pageNumber: number }
) => {
  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [logs, totalCount] = await Promise.all([
    DeletedTaskLogModel.find({ workspace: workspaceId })
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("project",    "_id name emoji")
      .populate("assignedTo", "_id name profilePicture")
      .populate("deletedBy",  "_id name profilePicture")
      .populate("createdBy",  "_id name"),
    DeletedTaskLogModel.countDocuments({ workspace: workspaceId }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    logs,
    pagination: { pageSize, pageNumber, totalCount, totalPages, skip },
  };
};

// ──────────────────────────────────────────────────────────────────
// CLEAR ALL DELETED TASK LOGS FOR A WORKSPACE
// ──────────────────────────────────────────────────────────────────
export const clearDeletedTaskLogsService = async (workspaceId: string) => {
  const result = await DeletedTaskLogModel.deleteMany({ workspace: workspaceId });
  return { deletedCount: result.deletedCount };
};
