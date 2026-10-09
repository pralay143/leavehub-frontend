# LeaveHub Frontend

The frontend for LeaveHub, an employee leave management system. The planned
stack is React, TypeScript, and Vite. This repository is kept separate from
the [backend](https://github.com/pralay143/leavehub-backend).

## Status

Repository setup only. Application code and the Vite project scaffold have
not been created yet.

## Planned stack

- React with TypeScript
- Vite for development and production builds
- Django REST Framework API, configured with `VITE_API_BASE_URL`

## Local development

1. Install a current Node.js LTS release.
2. Copy `.env.example` to `.env.local` and set the API URL if needed.
3. Once the Vite project has been scaffolded, install dependencies with
   `npm install` and start the development server with `npm run dev`.

Do not commit local environment files, credentials, or generated build output.
The repository `.gitignore` excludes these files and directories.
