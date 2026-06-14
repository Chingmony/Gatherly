# PostToolUse(Edit|Write) hook.
# Runs Checkstyle on backend Java edits. Blocks (exit 2) on violations so Claude
# sees the report on stderr and self-corrects. No-op for non-Java files.
$ErrorActionPreference = 'Continue'

$raw = [Console]::In.ReadToEnd()
try { $payload = $raw | ConvertFrom-Json } catch { exit 0 }

# Edit / Write / MultiEdit all carry the target under tool_input.file_path.
$path = [string]$payload.tool_input.file_path
if (-not $path -or ($path -notlike '*.java')) { exit 0 }   # only gate Java files

$backend = Join-Path $PSScriptRoot '..\..\backend'
$gradlew = Join-Path $backend 'gradlew.bat'
$buildFile = Join-Path $backend 'build.gradle.kts'
if (-not (Test-Path $gradlew)) { exit 0 }

# Dormant until the Checkstyle plugin is actually wired into the build, otherwise
# `checkstyleMain` is an unknown task and would block every single Java edit.
if (-not (Test-Path $buildFile) -or -not (Select-String -Path $buildFile -Pattern 'checkstyle' -Quiet)) {
    [Console]::Error.WriteLine("[checkstyle hook] Checkstyle plugin not configured in build.gradle.kts - skipping (non-blocking).")
    exit 0
}

# Force the spec-locked JDK 21; the inherited JAVA_HOME may be stale/invalid.
$jdk = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
if (Test-Path $jdk) { $env:JAVA_HOME = $jdk }

Push-Location $backend
$out = (& $gradlew checkstyleMain -q *>&1 | Out-String)
$code = $LASTEXITCODE
Pop-Location

if ($code -ne 0) {
    [Console]::Error.WriteLine("Checkstyle FAILED for $path (gradle exit $code):")
    [Console]::Error.WriteLine($out)
    exit 2   # PostToolUse: exit 2 surfaces stderr back to Claude
}
exit 0
