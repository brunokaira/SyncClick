import mongoose, { Document, Schema } from "mongoose";

/**
 * DeletedTaskLog – stores a snapshot of a task at the moment it was deleted.
 * One document is created for every delete action (single or bulk).
 */
export interface DeletedTaskLogDocument extends Document {
  // ── Snapshot fields (copied from the original Task) ──────────
  taskCode: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;

  // ── Relations (kept as ObjectIds for reference) ───────────────
  workspace: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId | null;
  assignedTo: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;

  // ── Audit fields ──────────────────────────────────────────────
  deletedBy: mongoose.Types.ObjectId;
  deletedAt: Date;
}

const deletedTaskLogSchema = new Schema<DeletedTaskLogDocument>(
  {
    taskCode:    { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, default: null },
    status:      { type: String, required: true },
    priority:    { type: String, required: true },
    dueDate:     { type: Date,   default: null },

    workspace:  { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    project:    { type: Schema.Types.ObjectId, ref: "Project",   default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User",      default: null },
    createdBy:  { type: Schema.Types.ObjectId, ref: "User",      required: true },

    deletedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const DeletedTaskLogModel = mongoose.model<DeletedTaskLogDocument>(
  "DeletedTaskLog",
  deletedTaskLogSchema
);

export default DeletedTaskLogModel;
