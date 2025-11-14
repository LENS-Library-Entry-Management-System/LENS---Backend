# Repository Guidelines

## Project Structure & Module Organization
The runtime entry is `server.ts`, which boots the Express app defined in `rfid-entry-backend/src/app.ts`. Feature logic lives under `rfid-entry-backend/src/` and is split into `controllers/`, `services/`, Sequelize `models/`, and HTTP `routes/`. Shared middleware sits in `src/middleware/`, while helpers and config utilities are in `src/utils/` and `src/config/`. Database helpers and setup scripts reside in `rfid-entry-backend/scripts/`, and local infrastructure is coordinated through `docker-compose.yml` with data persisted in `postgres-data/`.

## Build, Test, and Development Commands
Install dependencies once with `npm install`. `npm run dev` starts `ts-node-dev` with hot reload, while `npm run build` compiles to `dist/` and `npm start` runs that output. Database lifecycle scripts: `npm run db:create` (bootstrap tables), `npm run db:sync` (apply model changes), and `npm run seed:admin` (provision baseline accounts). Quality gates include `npm run lint`, `npm run lint:fix`, `npm run type-check`, and `npm test` for the Jest + Supertest suite with coverage.

## Coding Style & Naming Conventions
All code is TypeScript and must pass the shared ESLint rules plus `tsc --noEmit`. Use 2-space indentation, `camelCase` for variables/services, `PascalCase` for classes and Sequelize models, and ALL_CAPS for environment keys. Keep route, controller, and service filenames aligned with the resource (`logs.routes.ts`, `logs.controller.ts`) to simplify discovery.

## Testing Guidelines
Author Jest specs alongside the code they validate (e.g., `rfid-entry-backend/src/services/__tests__/attendance.service.test.ts`). Keep coverage near 80% by exercising controllers, services, and route contracts. Use Supertest for API endpoints and stub Sequelize models when pure unit behavior is needed. Prefix `describe` blocks with the method or route (`GET /logs`) so CI output stays searchable.

## Commit & Pull Request Guidelines
Follow the existing history by writing imperative, present-tense commit subjects (`Add admin seeding script`). Reference tickets or GitHub issues with `#ID` when applicable, and branch as `feature/<topic>` or `bugfix/<topic>`. Each PR should include a short summary, verification notes (commands run, screenshots when modifying API responses), and confirmation that lint, tests, and database scripts were run when touched.

## Security & Configuration Tips
Never commit `.env`; copy `.env.example`, update secrets, and load via the helpers in `src/config/`. The Postgres container writes to `postgres-data/`, so scrub that directory before handing off artifacts. Helmet, CORS, and rate limits are already initialized in `app.ts`; keep them applied when registering new routers or middleware.
