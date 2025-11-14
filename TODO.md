# TODO: Fix TypeScript Errors in rfid-entry-backend

## Errors to Fix
- app.ts: Imports for 'userRoutes' and 'rfidRoutes' that don't exist (but current code has authRoutes and entryRoutes, so may be outdated error).
- entryController.ts: Multiple "Not all code paths return a value" errors.
- entryController.ts: Unused 'req' parameter in one function.

## Plan
1. Verify app.ts imports - Current imports are authRoutes and entryRoutes, which exist. If error persists, may need to update or ignore if outdated.
2. Fix entryController.ts:
   - Add `return;` after each `res.json()` or `res.status().json()` in the affected functions to ensure all code paths return a value.
   - Affected functions: getAllEntries, getEntryById, updateEntry, deleteEntry, exportEntries.
   - Check for unused 'req' - In getActiveEntries, it's `_req`, which is fine. In deleteEntry, req is used, so perhaps error is misplaced.

## Dependent Files
- rfid-entry-backend/src/app.ts (if imports need change, but likely not)
- rfid-entry-backend/src/controllers/entryController.ts

## Followup Steps
- Run TypeScript compilation to verify errors are fixed.
- Test the application if possible.
