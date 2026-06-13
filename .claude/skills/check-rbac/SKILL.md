---
name: check-rbac
description: Audits all @PreAuthorize annotations on backend service methods against the Gatherly authorization matrix. Use before any PR that touches security gates, or when the release-blocking auth test suite is referenced.
disable-model-invocation: false
---

Audit the `@PreAuthorize` gates on all backend service methods against the normative authorization matrix.

## Step 1: Load the authorization matrix

Read `docs/00-system-overview.md` §5 (the RBAC matrix). This is the normative source of truth — every role × action combination is defined here. Note the hard constraints:
- Sub-admin (`MANAGER`) **cannot** delete users, events, or supply lists
- `HANDLER` can only update assigned materials
- `GUEST` can only register for public events (unauthenticated)

## Step 2: Find all @PreAuthorize annotations

Search `backend/src/` for all `@PreAuthorize` annotations on service-layer methods:

```bash
grep -rn "@PreAuthorize" backend/src/main/java/ --include="*.java"
```

Also check that controllers do NOT contain `@PreAuthorize` — authorization must be on service methods only.

## Step 3: Check each gate against the matrix

For each annotated method:
1. Identify which roles the annotation permits
2. Look up that action in the RBAC matrix
3. Flag any mismatch — permitted roles that shouldn't have access, or missing gates for roles that should be blocked

Pay special attention to:
- Methods that delete or deactivate resources (must be Admin-only or have explicit MANAGER exclusion)
- Event-scoped operations — these need both the JWT role check AND the `@eventSecurity` bean check
- Any method with no `@PreAuthorize` (potential missing gate — verify it's intentionally public)

## Step 4: Check for missing gates (default-deny verification)

Every non-public endpoint must have a `@PreAuthorize` or be covered by a global security config rule. List any service method that:
- Has no `@PreAuthorize`
- Is not explicitly whitelisted in the Spring Security config

## Step 5: Report findings

Produce a summary:
- ✅ Gates that match the matrix
- ❌ Gates that deviate (with the correct annotation)
- ⚠️ Methods with no gate that should have one

If any ❌ or ⚠️ items exist, propose the corrected `@PreAuthorize` expressions and ask the user to confirm before applying them.

## Reference: common @PreAuthorize patterns for this project

```java
// Admin only
@PreAuthorize("hasRole('ADMIN')")

// Admin or event Manager (event-scoped check)
@PreAuthorize("hasRole('ADMIN') or @eventSecurity.isManager(#eventId)")

// Admin or event Handler
@PreAuthorize("hasRole('ADMIN') or @eventSecurity.isHandler(#eventId)")

// Any authenticated user (for profile/self operations)
@PreAuthorize("isAuthenticated()")

// Public (no annotation needed — covered by security config permitAll)
```
