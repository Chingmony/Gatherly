# PreToolUse(Bash) hook.
# If the Bash command is a `git commit`, run the backend test suite first and DENY
# the commit (JSON permissionDecision) when tests fail. Any other Bash command is
# allowed straight through.
$ErrorActionPreference = 'Continue'

$raw = [Console]::In.ReadToEnd()
try { $payload = $raw | ConvertFrom-Json } catch { exit 0 }

$cmd = [string]$payload.tool_input.command
# Match a real `git commit` invocation (start of line or after a separator/space),
# so things like `git log --grep commit` do not trip the gate.
if ($cmd -notmatch '(^|[\s;&|(])git\s+commit\b') { exit 0 }

$backend = Join-Path $PSScriptRoot '..\..\backend'
$gradlew = Join-Path $backend 'gradlew.bat'
if (-not (Test-Path $gradlew)) { exit 0 }

# Force the spec-locked JDK 21; the inherited JAVA_HOME may be stale/invalid.
$jdk = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
if (Test-Path $jdk) { $env:JAVA_HOME = $jdk }

Push-Location $backend
$out = (& $gradlew test *>&1 | Out-String)
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) {
    $tail = ($out -split "`r?`n" | Select-Object -Last 40) -join "`n"
    $reason = "Pre-commit gate: ./gradlew test FAILED (gradle exit $code). Commit blocked. Fix the failing tests before committing.`n`n--- last test output ---`n$tail"
    $decision = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = $reason
        }
    }
    $decision | ConvertTo-Json -Depth 5 -Compress
    exit 0   # decision is conveyed via JSON on stdout
}
exit 0
