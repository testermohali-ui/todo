import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './models/Task.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo_app';

const day = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const sampleTasks = [
  {
    title: 'Review the sprint board and pick three priorities',
    notes: 'Keep it to the three that actually move the release forward.',
    priority: 'high',
    dueDate: day(0),
    tags: ['planning'],
    completed: false,
  },
  {
    title: 'Ship the new onboarding flow copy',
    priority: 'high',
    dueDate: day(-1),
    tags: ['writing', 'product'],
    completed: false,
  },
  {
    title: 'Pair on the payments retry job',
    notes: 'Walk through the backoff logic together before the demo.',
    priority: 'medium',
    dueDate: day(1),
    tags: ['engineering'],
    completed: false,
  },
  {
    title: 'Book the team offsite venue',
    priority: 'low',
    dueDate: day(6),
    tags: ['ops'],
    completed: false,
  },
  {
    title: 'Set up the weekly metric digest',
    priority: 'medium',
    dueDate: null,
    tags: ['growth'],
    completed: false,
  },
  {
    title: 'Fix the flaky snapshot test',
    priority: 'medium',
    dueDate: null,
    tags: ['engineering'],
    completed: true,
  },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  const count = await Task.countDocuments();
  if (count > 0 && !process.argv.includes('--force')) {
    console.log(`[seed] ${count} tasks already exist, nothing to do (use --force to add anyway)`);
  } else {
    const created = await Task.insertMany(sampleTasks);
    console.log(`[seed] inserted ${created.length} sample tasks`);
  }
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('[seed] failed:', error.message);
  process.exit(1);
});
