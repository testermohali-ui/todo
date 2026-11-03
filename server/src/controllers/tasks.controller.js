import Task from '../models/Task.js';
import { asyncHandler, ApiError } from '../middleware/asyncHandler.js';
import { validateTask, buildTaskFilter } from '../utils/validation.js';

const SORTS = {
  created: { createdAt: -1 },
  due: { completed: 1, dueDate: 1, createdAt: -1 },
  title: { title: 1 },
  priority: { completed: 1, priority: -1, createdAt: -1 },
};

function assertObjectId(id) {
  if (!id || !/^[a-f\d]{24}$/i.test(id)) throw new ApiError(400, 'Invalid task id');
}

export const listTasks = asyncHandler(async (req, res) => {
  const { status, q, priority, sort = 'created' } = req.query;
  const filter = buildTaskFilter({ status, q, priority });
  const order = SORTS[sort] || SORTS.created;
  const tasks = await Task.find(filter).sort(order).limit(500);
  res.json({ count: tasks.length, tasks });
});

export const getTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ task });
});

export const createTask = asyncHandler(async (req, res) => {
  const { errors, value } = validateTask(req.body);
  if (errors.length) throw new ApiError(400, 'Validation failed', errors);
  const task = await Task.create(value);
  res.status(201).json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const { errors, value } = validateTask(req.body, { partial: true });
  if (errors.length) throw new ApiError(400, 'Validation failed', errors);
  if (Object.keys(value).length === 0) throw new ApiError(400, 'No valid fields to update');

  const task = await Task.findByIdAndUpdate(req.params.id, { $set: value }, {
    new: true,
    runValidators: true,
  });
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ task: task.toJSON() });
});

export const clearCompleted = asyncHandler(async (_req, res) => {
  const result = await Task.deleteMany({ completed: true });
  res.json({ deletedCount: result.deletedCount });
});

export const getStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [summary] = await Task.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$completed', false] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', now] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  const stats = summary || { total: 0, completed: 0, high: 0, overdue: 0 };
  res.json({ ...stats, active: stats.total - stats.completed });
});
