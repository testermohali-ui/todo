import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTask,
  buildTaskFilter,
  normalizeTags,
  escapeRegex,
} from '../src/utils/validation.js';
import Task from '../src/models/Task.js';

test('validateTask requires a title', () => {
  const { errors } = validateTask({});
  assert.deepEqual(errors, ['Title is required']);
});

test('validateTask trims and accepts a full payload', () => {
  const { errors, value } = validateTask({
    title: '  Buy milk  ',
    notes: ' 2 litres ',
    priority: 'high',
    dueDate: '2026-12-01',
    tags: '#groceries, kitchen',
    completed: false,
  });
  assert.deepEqual(errors, []);
  assert.equal(value.title, 'Buy milk');
  assert.equal(value.notes, '2 litres');
  assert.equal(value.priority, 'high');
  assert.ok(value.dueDate instanceof Date);
  assert.deepEqual(value.tags, ['groceries', 'kitchen']);
});

test('validateTask rejects long titles and bad priorities', () => {
  const { errors } = validateTask({ title: 'x'.repeat(161), priority: 'urgent' });
  assert.equal(errors.length, 2);
  assert.match(errors[0], /160 characters/);
  assert.match(errors[1], /Priority/);
});

test('validateTask partial mode only checks provided fields', () => {
  const { errors, value } = validateTask({ completed: true }, { partial: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(value, { completed: true });
});

test('validateTask accepts an empty due date as null', () => {
  const { errors, value } = validateTask({ title: 'a', dueDate: '' });
  assert.deepEqual(errors, []);
  assert.equal(value.dueDate, null);
});

test('normalizeTags dedupes, strips # and caps the list', () => {
  const tags = normalizeTags(['Work', '#work', '  home ', '', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
  assert.deepEqual(tags, ['Work', 'home', 'a', 'b', 'c', 'd', 'e', 'f']);
});

test('escapeRegex neutralises special characters', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
});

test('buildTaskFilter builds status, priority and search clauses', () => {
  const filter = buildTaskFilter({ status: 'active', q: 'milk', priority: 'high' });
  assert.equal(filter.completed, false);
  assert.equal(filter.priority, 'high');
  assert.equal(filter.$or.length, 3);
  assert.ok(filter.$or[0].title instanceof RegExp);
});

test('buildTaskFilter ignores unknown status and priority', () => {
  const filter = buildTaskFilter({ status: 'nonsense', priority: 'urgent' });
  assert.deepEqual(filter, {});
});

test('Task schema applies defaults and validates priority', async () => {
  const task = new Task({ title: 'Ship it' });
  assert.equal(task.priority, 'medium');
  assert.equal(task.completed, false);
  assert.deepEqual(task.tags, []);
  await task.validate();

  const bad = new Task({ title: 'Ship it', priority: 'urgent' });
  await assert.rejects(() => bad.validate(), /Priority/);
});

test('Task schema sets completedAt when completed', async () => {
  const task = new Task({ title: 'Done thing', completed: true });
  await task.validate();
  assert.ok(task.completedAt instanceof Date);
});
