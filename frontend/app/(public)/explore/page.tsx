import { Search, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

const EVENTS = [
  { id: "ev1", name: "NorthStar Leadership Summit",  date: "Jun 18, 2026", location: "San Francisco, CA",  category: "Leadership", cover: "#6366f1", spots: 158 },
  { id: "ev2", name: "Lumen Design Festival",        date: "Jul 4, 2026",  location: "New York, NY",       category: "Design",     cover: "#8b5cf6", spots: 2016 },
  { id: "ev3", name: "Founders Circle — Q3",         date: "Sep 10, 2026", location: "Chicago, IL",        category: "Startup",    cover: "#ec4899", spots: 90 },
  { id: "ev4", name: "Horizon Product Summit",       date: "Oct 3, 2026",  location: "Austin, TX",         category: "Product",    cover: "#14b8a6", spots: 350 },
  { id: "ev5", name: "DevConnect Winter",            date: "Aug 22, 2026", location: "Boston, MA",         category: "Tech",       cover: "#f59e0b", spots: 500 },
  { id: "ev6", name: "Global Impact Forum",          date: "Nov 1, 2026",  location: "Seattle, WA",        category: "Social",     cover: "#22c55e", spots: 1200 },
];

const CATEGORIES = ["All", "Leadership", "Design", "Startup", "Product", "Tech", "Social"];

export default function ExplorePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Public topbar */}
      <header
        className="sticky top-0 z-30 h-[64px] flex items-center px-6 gap-4"
        style={{
          background: "color-mix(in srgb, var(--surface) 90%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-hex,#ecedf4)",
        }}
      >
        <Logo size={30} />
        <div className="flex-1" />
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Hero search */}
        <div className="flex flex-col items-center gap-5 text-center py-6">
          <h1 className="text-[32px] font-extrabold m-0 leading-tight" style={{ color: "var(--text-strong)" }}>
            Discover upcoming events
          </h1>
          <p className="text-base m-0 max-w-md" style={{ color: "var(--text-muted)" }}>
            Find conferences, workshops, and community gatherings near you.
          </p>
          <div className="relative w-full max-w-lg">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type="search"
              placeholder="Search events, topics, or locations…"
              className="w-full h-[52px] pl-12 pr-5 rounded-[var(--radius-lg)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)", boxShadow: "var(--shadow-card)" }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className="px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer"
              style={{
                background: cat === "All" ? "var(--primary-hex,#6366f1)" : "var(--surface)",
                borderColor: cat === "All" ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                color: cat === "All" ? "#fff" : "var(--text-muted)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EVENTS.map((ev) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}/register`}
              className="group rounded-[22px] overflow-hidden border transition-all hover:-translate-y-1"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-hex,#ecedf4)",
                boxShadow: "var(--shadow-card)",
                textDecoration: "none",
                display: "block",
              }}
            >
              {/* Cover */}
              <div
                className="h-36 flex items-end px-5 pb-4"
                style={{ background: `linear-gradient(135deg, ${ev.cover}, color-mix(in srgb, ${ev.cover} 40%, #22c55e))` }}
              >
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,.18)", color: "#fff", backdropFilter: "blur(6px)" }}
                >
                  {ev.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-2.5">
                <h3
                  className="text-[15px] font-extrabold leading-snug m-0 group-hover:text-[var(--primary-hex)] transition-colors"
                  style={{ color: "var(--text-strong)" }}
                >
                  {ev.name}
                </h3>
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={12} /> {ev.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={12} /> {ev.location}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>
                    {ev.spots.toLocaleString()} spots left
                  </span>
                  <StatusBadge variant="green">Open</StatusBadge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
