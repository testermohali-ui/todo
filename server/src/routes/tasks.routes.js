import { Router } from 'express';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  clearCompleted,
  getStats,
} from '../controllers/tasks.controller.js';

const router = Router();

router.get('/stats', getStats);
router.delete('/completed', clearCompleted);

router.route('/').get(listTasks).post(createTask);
router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

export default router;
