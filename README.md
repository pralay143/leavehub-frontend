# LeaveHub Frontend

The frontend for LeaveHub, an employee leave management system. The planned
stack is React, TypeScript, and Vite. This repository is kept separate from
the [backend](https://github.com/pralay143/leavehub-backend).

## Status

The Vite React + TypeScript project has been scaffolded from the
`create-vite` `react-ts` template. No LeaveHub application features have
been implemented yet.

## Planned stack

- React with TypeScript
- Vite for development and production builds
- Django REST Framework API, configured with `VITE_API_BASE_URL`

## Local development

1. Install a current Node.js LTS release.
2. Copy `.env.example` to `.env.local` and set the API URL if needed.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev` (http://localhost:5173).

Other scripts: `npm run build` (type-check and production build to `dist/`),
`npm run lint` (oxlint), and `npm run preview` (serve the production build).

Do not commit local environment files, credentials, or generated build output.
The repository `.gitignore` excludes these files and directories.
