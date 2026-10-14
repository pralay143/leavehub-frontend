# LeaveHub Frontend

Web app for LeaveHub, an employee leave management system. It talks to the
Django REST API in the separate
[leavehub-backend](https://github.com/pralay143/leavehub-backend) repository.

## Stack

- React 19, TypeScript 6, Vite 8
- React Router 8 and TanStack Query 5
- Mantine 9 (components, forms, dates, notifications, modals)
- A typed API client generated from the backend's OpenAPI schema with
  `@hey-api/openapi-ts`

## Pages

| Page | Who | What |
|---|---|---|
| Login | Everyone | Email and password |
| Dashboard | Everyone | Balance cards (available, used, pending), upcoming leave and public holidays, review count for approvers |
| My requests | Everyone | Filter by status and year, create a request (calendar marks public holidays; working-day preview excludes weekends and holidays), cancel |
| Request details | Employee, their manager, HR | Details, review comment and the actions the user may take |
| Review | Managers, HR | Pending requests routed to you: approve, or reject with a comment |
| Team | Managers, HR | Direct reports' requests; HR can switch to all employees |
| Users, Departments, Leave types, Holidays, Balances | HR | Administration, including public holidays and yearly balance allocation with a dry-run preview |

The navigation only shows pages for your role; the backend enforces all
permissions.

## Local setup

Requirements: Node.js 22.22 or later (required by React Router 8), and the backend running on
http://127.0.0.1:8000 (see the backend README).

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:5173 and log in with a backend user, for example the
superuser created with `createsuperuser`.

### Configuration

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend origin, default `http://localhost:8000`. Do not add `/api`; the generated paths already include it |

Vite reads env files only at startup, so restart `npm run dev` after changing
`.env.local`. The backend must allow this origin in `CORS_ALLOWED_ORIGINS`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server on http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Lint with oxlint |
| `npm run api:generate` | Regenerate `src/api/generated/` from the running backend's schema |

## API client

`src/api/generated/` is generated code and is committed, so the app builds
without the backend. Do not edit it by hand: after an API change, start the
backend and run `npm run api:generate` (set `OPENAPI_SCHEMA_URL` to use a
different schema URL).

`src/api/client.ts` configures the base URL, sends the access token, and
provides `unwrap()` and `ApiError` for turning API responses into data or
errors with field-level messages.

## Authentication

- The access token is kept in memory and the refresh token in `localStorage`.
- On a 401 the client refreshes once and retries. All concurrent requests
  share a single refresh, because the backend's refresh tokens are single-use.
- Sessions are restored on reload, and logging out in one tab logs out the
  others. Logout also revokes the refresh token on the server.

## Project layout

```
src/
  api/          client setup, config, generated client
  auth/         tokens, AuthProvider, route guards, role helpers
  features/
    leave/      leave data hooks, request table, balance cards, forms and modals
    admin/      admin data hooks
  components/   shared UI helpers (loading/error states, form error mapping)
  layout/       app shell and role-based navigation
  pages/        route components (admin pages under pages/admin)
  router.tsx    routes, lazily loaded per page
```

## Deployment

The `Dockerfile` builds the app with Node and serves it with nginx (non-root,
port 8080). The API address is compiled in, so build once per environment:

```sh
docker build -t leavehub-frontend --build-arg VITE_API_BASE_URL=https://api.leavehub.example.com .
docker run -d -p 8080:8080 -e API_ORIGIN=https://api.leavehub.example.com leavehub-frontend
```

- `API_ORIGIN` is added to the Content-Security-Policy `connect-src`; leave it
  empty when the API is served from the same origin.
- nginx serves `index.html` for client-side routes, caches the fingerprinted
  files in `/assets/` long-term, and sends security headers (CSP,
  `X-Frame-Options`, `nosniff`, `Referrer-Policy`). See
  `nginx/default.conf.template`.
- `GET /healthz` returns `ok` for health checks.
- On a static host instead of Docker, run `npm run build` with
  `VITE_API_BASE_URL` set, publish `dist/`, rewrite unknown paths to
  `/index.html`, and set the same security headers.

The full guide, including backend settings, is in the backend repository's
`DEPLOYMENT.md`.

## Notes

- `npm audit` reports issues in `js-yaml`, which is only used by the
  development-time client generator; the shipped app has none
  (`npm audit --omit=dev`). The generator reads the schema as JSON.
- Do not commit `.env.local`, `node_modules` or `dist`; `.gitignore` excludes them.
