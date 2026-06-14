# SessionStart hook.
# Injects the four ABSOLUTE sub-admin restrictions (CLAUDE.md) into session context.
$reminder = @"
================ Gatherly - ABSOLUTE sub-admin restrictions ================
Sub-admins may NEVER do the following (hard boundaries - never bypass):
  1. Delete a user
  2. Delete an event
  3. Delete a main supply list
  4. Edit the company / organization profile
Enforce event-scoped (Layer 2) authZ in the Service layer via
@PreAuthorize("@eventSecurity.canManage(eventId, auth)"). Every non-public
endpoint must be gated (default-deny).
===========================================================================
"@

$out = @{
    hookSpecificOutput = @{
        hookEventName     = 'SessionStart'
        additionalContext = $reminder
    }
}
$out | ConvertTo-Json -Depth 5 -Compress
exit 0
