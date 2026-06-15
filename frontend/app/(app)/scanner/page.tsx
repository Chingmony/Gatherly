"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Calendar, MapPin, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import type { EventResponse } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

export default function ScannerPickerPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<EventResponse[]>("/events?size=100")
      .then((data) => {
        const evs = (data ?? []).filter((e) => isToday(e.startsAt));
        if (evs.length === 1) {
          router.replace(`/events/${evs[0].id}/scanner`);
          return;
        }
        setEvents(evs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load events"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 view-anim">
        <PageHeader title="Select Event" sub="Showing events scheduled for today" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 view-anim">
        <PageHeader title="Select Event" sub="Showing events scheduled for today" />
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col gap-5 view-anim">
        <PageHeader title="Select Event" sub="Showing events scheduled for today" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <QrCode size={36} style={{ color: "var(--text-faint)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No events today</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>There are no events scheduled for today. Check back on the day of your event.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="Select Event" sub="Showing events scheduled for today" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => router.push(`/events/${event.id}/scanner`)}
            className="text-left w-full transition-transform active:scale-[.98]"
          >
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="px-5 py-4 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--primary-soft)" }}
                >
                  <QrCode size={18} style={{ color: "var(--primary-hex,#6366f1)" }} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>
                    {event.title}
                  </p>
                  {event.venue && (
                    <p className="flex items-center gap-1 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      <MapPin size={11} className="flex-shrink-0" />
                      {event.venue}
                    </p>
                  )}
                  <p className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                    <Calendar size={11} className="flex-shrink-0" />
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <ChevronRight size={16} className="flex-shrink-0" style={{ color: "var(--text-faint)" }} />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
