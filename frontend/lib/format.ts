/** Short date: "Jul 15, 2026". */
export function fd(d: string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Initials from a full name: "Sarah Chen" → "SC". */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}
