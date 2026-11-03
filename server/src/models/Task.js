import mongoose from 'mongoose';

export const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A task title is required'],
      trim: true,
      maxlength: [160, 'Title cannot exceed 160 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
      default: '',
    },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: 'Priority must be low, medium or high' },
      default: 'medium',
    },
    dueDate: { type: Date, default: null },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 8,
        message: 'A task can have at most 8 tags',
      },
    },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

taskSchema.index({ completed: 1, dueDate: 1 });
taskSchema.index({ priority: 1 });

// Keep completedAt in sync whenever `completed` flips, on any write path.
function syncCompletedAt() {
  const update = this.getUpdate();
  if (update && update.$set && 'completed' in update.$set) {
    update.$set.completedAt = update.$set.completed ? new Date() : null;
  }
}

function setCompletedAt() {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : null;
  }
}

taskSchema.pre('validate', setCompletedAt);
taskSchema.pre('save', setCompletedAt);

taskSchema.pre('findOneAndUpdate', syncCompletedAt);
taskSchema.pre('updateOne', syncCompletedAt);

const Task = mongoose.model('Task', taskSchema);

export default Task;
