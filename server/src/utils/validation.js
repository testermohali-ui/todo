/**
 * Input validation for task writes. Dependency-free and pure so it can be
 * unit tested without a database.
 */

export const PRIORITIES = ['low', 'medium', 'high'];
const TITLE_MAX = 160;
const NOTES_MAX = 2000;
const TAG_MAX = 8;
const TAG_LENGTH_MAX = 24;

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeTags(input) {
  if (input == null) return [];
  const list = Array.isArray(input) ? input : String(input).split(',');
  const seen = new Set();
  const tags = [];
  for (const raw of list) {
    const tag = String(raw).trim().replace(/^#/, '');
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag.slice(0, TAG_LENGTH_MAX));
  }
  return tags.slice(0, TAG_MAX);
}

function parseDate(value) {
  if (value === null || value === '') return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: 'Due date must be a valid date' };
  return { value: date };
}

/**
 * @param {object} body raw request body
 * @param {{ partial?: boolean }} [options]
 * @returns {{ errors: string[], value: object }}
 */
export function validateTask(body = {}, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (!partial || 'title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) errors.push('Title is required');
    else if (title.length > TITLE_MAX) errors.push(`Title cannot exceed ${TITLE_MAX} characters`);
    else value.title = title;
  }

  if ('notes' in body) {
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (notes.length > NOTES_MAX) errors.push(`Notes cannot exceed ${NOTES_MAX} characters`);
    else value.notes = notes;
  }

  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') errors.push('completed must be a boolean');
    else value.completed = body.completed;
  }

  if ('priority' in body) {
    if (!PRIORITIES.includes(body.priority)) {
      errors.push('Priority must be one of: low, medium, high');
    } else {
      value.priority = body.priority;
    }
  }

  if ('dueDate' in body) {
    const { value: due, error } = parseDate(body.dueDate);
    if (error) errors.push(error);
    else value.dueDate = due;
  }

  if ('tags' in body) {
    value.tags = normalizeTags(body.tags);
  }

  return { errors, value };
}

/**
 * Builds a Mongo filter from whitelisted query params.
 */
export function buildTaskFilter({ status = 'all', q = '', priority = 'all' } = {}) {
  const filter = {};

  if (status === 'active') filter.completed = false;
  else if (status === 'completed') filter.completed = true;
  else if (status === 'overdue') {
    filter.completed = false;
    filter.dueDate = { $ne: null, $lt: new Date() };
  }

  if (priority !== 'all' && PRIORITIES.includes(priority)) filter.priority = priority;

  const term = String(q || '').trim().slice(0, 80);
  if (term) {
    const rx = new RegExp(escapeRegex(term), 'i');
    filter.$or = [{ title: rx }, { notes: rx }, { tags: rx }];
  }

  return filter;
}
