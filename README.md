# Strength Trainer — Frontend
Link of the app: https://b1train.vercel.app/
A workout-tracking web app for logging strength training sessions, following progression over time, and getting AI-generated training feedback. Built with [Astro](https://astro.build) (server-rendered) and React islands for the interactive parts.

This is the frontend half of the project. The API it talks to lives in a companion repo: [trainingBackend](https://github.com/Biti-k/trainingBackend) (FastAPI + PostgreSQL).

## Features

- **Google OAuth login** — sign in with Google, no separate password to manage.
- **Workout logging** — record a session as a set of exercises × sets, each with weight, reps, and optional RPE and notes; edit or delete any past workout.
- **Exercise library** — maintain your own list of exercises, or pull from a built-in exercise catalog (with muscle group, equipment, and instructions) instead of typing them from scratch.
- **Analytics dashboard** — volume and progression charts per exercise, bodyweight trend over time, and a calendar view of training frequency (via Recharts).
- **AI training assistant** — a chat widget (Google Gemini) that answers fitness questions using your actual recent workout history as context.
- A little 3D dumbbell (Three.js) on the dashboard, because why not.

## Tech stack

- [Astro](https://astro.build) 6 (server output, `@astrojs/vercel` adapter)
- React 18 for interactive components (`client:load` islands)
- TypeScript
- Tailwind CSS
- Recharts (charts) · Three.js (3D scene)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

The dev server runs at `http://localhost:4321` by default. You'll need the backend running as well (see [trainingBackend](https://github.com/Biti-k/trainingBackend)) for anything past the login screen to work.

### Environment variables

| Variable | Description |
|---|---|
| `PUBLIC_API_BASE` | Base URL of the backend API (e.g. `http://localhost:8000`) |

## Architecture notes

- **Auth**: the backend issues a JWT after a successful Google OAuth login. Rather than putting that token in a redirect URL (where it'd sit in browser history and server logs for the life of the session), the OAuth callback hands back a short-lived, single-use exchange code; [`/auth/finish`](src/pages/auth/finish.astro) swaps it server-side for the real token and stores it in an `httpOnly` cookie. A copy is also exposed to client-side JS (`window.__SESSION_TOKEN__`, set in [`Layout.astro`](src/layouts/Layout.astro)) so React components can attach it as a `Bearer` header when calling the API directly.
- **Routing/auth guard**: [`src/middleware.ts`](src/middleware.ts) redirects any request without a session cookie to `/login`, except for the login and OAuth callback routes themselves.
- **API layer**: all backend calls go through a single typed client, [`src/services/api.ts`](src/services/api.ts).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`astro check`) and build for production |
| `npm run preview` | Preview the production build locally |
