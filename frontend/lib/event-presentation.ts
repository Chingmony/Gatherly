/** Per-event public presentation (category + gradient + blurb) keyed by id (string). */
export const EVENT_PRESENTATION: Record<string, { cat: string; grad: string; blurb: string }> = {
  '1': {
    cat: 'Conference',
    grad: 'linear-gradient(135deg,#7C3AED 0%,#C026D3 100%)',
    blurb:
      "Two days of keynotes, hands-on labs and networking for 500 builders shaping what's next.",
  },
  '2': {
    cat: 'Launch',
    grad: 'linear-gradient(135deg,#6D28D9 0%,#A855F7 100%)',
    blurb: "An exclusive first look at our Q3 product line, with live demos and Q&A.",
  },
  '3': {
    cat: 'Gala',
    grad: 'linear-gradient(135deg,#C026D3 0%,#7C3AED 100%)',
    blurb: "A black-tie evening celebrating the year's milestones — dinner, awards and music.",
  },
  '4': {
    cat: 'Summit',
    grad: 'linear-gradient(135deg,#2B2A3F 0%,#7C3AED 100%)',
    blurb: 'Deep technical sessions for engineers, across four parallel tracks.',
  },
  '5': {
    cat: 'Dinner',
    grad: 'linear-gradient(135deg,#7C3AED 0%,#2B2A3F 100%)',
    blurb: "An intimate founders' dinner — curated conversations over a seasonal menu.",
  },
}

const DEFAULT_PRESENTATION = EVENT_PRESENTATION['1']!

export function presentationFor(id: string) {
  return EVENT_PRESENTATION[id] ?? DEFAULT_PRESENTATION
}
