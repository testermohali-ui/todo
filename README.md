# Focus — MERN Todo Manager

A full-stack todo app with a calm, modern interface. Tasks are stored in
MongoDB, served by an Express API, and managed on the client with Redux
Toolkit (thunks + entity adapter, optimistic updates, rollback on failure).

![stack](https://img.shields.io/badge/stack-MERN-6366f1) ![state](https://img.shields.io/badge/state-Redux%20Toolkit-764abc)

## Features

- **Fast task entry** — title, priority, due date (with Today/Tomorrow shortcuts) and tags.
- **Inline editing** — click any task to edit title, notes, priority, due date and tags.
- **Smart views** — All, Today (incl. overdue), Upcoming, Completed, with live counts.
- **Search, priority filter and sorting** (smart / due date / newest / A–Z).
- **Optimistic UI** — completing, editing and deleting apply instantly and roll back if the API fails.
- **Undo** — deleting a task shows a toast with an undo action.
- **Dark / light theme**, remembered between visits.
- **Keyboard shortcuts** — `N` focuses the composer, `/` focuses search.
- **Responsive layout** — sidebar collapses into a drawer on small screens.
- **Real validation** on the server (title length, priorities, dates, tag limits) with clear error messages.

## Tech stack

| Layer    | Choices                                                                 |
| -------- | ----------------------------------------------------------------------- |
| Frontend | React 19, Vite, Redux Toolkit + React-Redux, Tailwind CSS, lucide icons, dayjs |
| Backend  | Node.js, Express 5, Mongoose 9                                          |
| Database | MongoDB (local instance, data stored in `.data/db`)                     |

## Project structure

```
todo-app/
├── client/                 # React app (Vite)
│   ├── src/
│   │   ├── api/client.js   # axios instance + error normalisation
│   │   ├── components/     # Sidebar, Topbar, TaskComposer, TaskList, TaskItem, Toasts…
│   │   ├── lib/date.js     # due-date helpers, grouping, priority meta
│   │   ├── store/          # configureStore, tasksSlice, uiSlice, selectors
│   │   └── test/           # vitest + Testing Library
│   └── vite.config.js      # dev proxy /api → :5001
├── server/                 # Express API
│   ├── src/
│   │   ├── app.js          # express app factory (CORS, routes, static, errors)
│   │   ├── index.js        # bootstrap, graceful shutdown
│   │   ├── config/db.js    # mongoose connection
│   │   ├── controllers/    # task handlers (CRUD, stats, clear completed)
│   │   ├── middleware/     # asyncHandler, ApiError, not-found + error handler
│   │   ├── models/Task.js  # schema, indexes, completedAt hooks
│   │   ├── routes/         # /api/tasks router
│   │   ├── utils/          # validation + filter builders (pure, unit tested)
│   │   └── seed.js         # sample data
│   └── test/               # node:test unit tests
├── scripts/                # setup, dev, start, mongo control
└── package.json            # convenience scripts
```

## Quick start

```bash
cd "todo-app"

bash scripts/setup.sh      # install deps (once)
bash scripts/dev.sh        # MongoDB + API + Vite
```

Then open **http://localhost:5173**.

`scripts/dev.sh` starts a project-local MongoDB (data in `.data/db`), the API on
port **5001** and Vite on **5173** (proxying `/api`). Press `Ctrl+C` to stop the
app; MongoDB keeps running until `bash scripts/mongo.sh stop`.

Want sample tasks?

```bash
bash scripts/mongo.sh start
node server/src/seed.js
```

### One-port production run

```bash
bash scripts/start.sh     # builds the client, serves everything on :5001
```

## How the toolchain is resolved

`scripts/_env.sh` finds a Node install and a `mongod` binary in this order:

1. `NODE_HOME` / `MONGO_BIN` environment variables;
2. a `.tools/` folder next to the project (this machine has Node 26.13 and
   MongoDB 8.2 there);
3. Homebrew (`brew --prefix`) or `mongod` on `PATH`.

So the scripts work even when `node` is not on your `PATH`. To use your own
install, run `NODE_HOME=/path/to/node/bin bash scripts/dev.sh`.

## API

Base URL: `http://localhost:5001/api`

| Method   | Path                 | Description                                        |
| -------- | -------------------- | -------------------------------------------------- |
| `GET`    | `/health`            | Liveness probe                                     |
| `GET`    | `/tasks`             | List tasks. Query: `status=all\|active\|completed\|overdue`, `q`, `priority`, `sort=created\|due\|title\|priority` |
| `POST`   | `/tasks`             | Create a task                                      |
| `GET`    | `/tasks/:id`         | Fetch one task                                     |
| `PATCH`  | `/tasks/:id`         | Partial update (any of title/notes/completed/priority/dueDate/tags) |
| `DELETE` | `/tasks/:id`         | Delete a task (returns the deleted task)           |
| `DELETE` | `/tasks/completed`   | Delete every completed task                        |
| `GET`    | `/tasks/stats`       | Aggregate `{ total, completed, active, high, overdue }` |

### Task document

```json
{
  "id": "6730c1f0a1b2c3d4e5f60718",
  "title": "Ship the onboarding copy",
  "notes": "Short and friendly",
  "completed": false,
  "priority": "high",
  "dueDate": "2026-11-04T12:00:00.000Z",
  "tags": ["writing"],
  "completedAt": null,
  "createdAt": "2026-11-03T09:00:00.000Z",
  "updatedAt": "2026-11-03T09:00:00.000Z"
}
```

Errors are always `{ "message": "...", "details"?: ["..."] }` with a meaningful
status code (400 validation, 404 missing task, 409 duplicate, 500 unexpected).

### Example requests

```bash
curl http://localhost:5001/api/tasks

curl -X POST http://localhost:5001/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Book flights","priority":"high","dueDate":"2026-11-10","tags":["travel"]}'

curl -X PATCH http://localhost:5001/api/tasks/<id> \
  -H 'Content-Type: application/json' -d '{"completed":true}'
```

## Redux architecture

- `tasksSlice` — `createEntityAdapter` store plus async thunks
  (`fetchTasks`, `addTask`, `updateTask`, `toggleTask`, `removeTask`,
  `clearCompleted`). `toggleTask` and `removeTask` update state optimistically
  in `pending` and roll back in `rejected`.
- `uiSlice` — active view, search text, priority filter, sort order, theme,
  sidebar state and the toast queue.
- `store/selectors.js` — memoised `selectVisibleTasks` (view + search +
  priority + sort) and `selectStats`, so components never filter by hand.

## Configuration

`server/.env` (created from `.env.example` by `setup.sh`):

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/todo_app
CLIENT_ORIGIN=http://localhost:5173
```

To use MongoDB Atlas or a remote database, change `MONGO_URI`. In development
the client calls `/api`, which Vite proxies to the API; set `VITE_API_URL` in
`client/.env` only if the API lives somewhere else.

## Tests

```bash
npm --prefix server test    # validation, filters and schema (node:test)
npm --prefix client test    # Redux slices + App interaction tests (vitest)
```

## Troubleshooting

- **`port 5001 is already in use`** — set `PORT` in `server/.env`, and add the
  matching target to `client/vite.config.js` (or set `VITE_API_URL`).
- **`mongod not found`** — `brew tap mongodb/brew && brew install mongodb-community`,
  or set `MONGO_BIN=/path/to/mongod`.
- **Mongo won't start** — check `.data/mongod.log`. Run
  `bash scripts/mongo.sh stop` before starting again.
- **Blank page with the API running** — open the browser console; a 502 on
  `/api/*` means the API is not up yet on port 5001.
- **`EPERM` when starting mongod or the API** — the process is running inside a
  sandbox that blocks listening on local ports. Run the scripts from a normal
  Terminal window instead.
