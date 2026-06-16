# Git rules

Applies repo-wide. Loaded automatically alongside CLAUDE.md.

## Branches & PRs
- Branch names: `feature/<short-desc>` or `fix/<short-desc>`
- PRs target `develop`
- Commit style: `feat:`, `fix:`, `docs:`, `test:`, `chore:` prefixes

## Before committing
- **Run tests first** — backend `./gradlew test`, frontend `npm test`. Do not commit unverified code.
- Run formatters before committing: backend `./gradlew spotlessApply`, frontend `npm run format:write`.

## Before Pushing (Heavy Production Gates)
Must pass completely before pushing branches to remote repositories (GitHub/GitLab) or opening a Pull Request.
- **Backend Verification:** 
  - Run `./gradlew test` to ensure all unit and integration tests pass.
- **Frontend Verification:**
  - Run `npm run build` to compile the production bundle. Next.js natively executes strict type-checking (`tsc`) and security linting (`eslint`) during this process. Any compiler warning or error will break the build.
  - Run `npm test` to verify component and utility logic passes.

## Merge conflicts
- **Never resolve merge conflicts autonomously.** When a merge conflicts, summarize the conflicting changes on each side and let the user choose how to resolve each one.
