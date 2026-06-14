"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

const ALL_TASKS = [
  { id: "t1", event: "NorthStar Summit",      task: "Stage A crowd control",   status: "in-progress", due: "Jun 18, 9 AM",  assigned: "You" },
  { id: "t2", event: "NorthStar Summit",      task: "Badge scanner station 2", status: "todo",        due: "Jun 18, 9 AM",  assigned: "You" },
  { id: "t3", event: "NorthStar Summit",      task: "Catering coordination",   status: "done",        due: "Jun 17",        assigned: "You" },
  { id: "t4", event: "Lumen Design Festival", task: "Registration desk setup", status: "todo",        due: "Jul 4, 9 AM",   assigned: "You" },
  { id: "t5", event: "Lumen Design Festival", task: "Sponsor booth assist",    status: "todo",        due: "Jul 4, 10 AM",  assigned: "You" },
  { id: "t6", event: "DevConnect Winter",     task: "AV pre-check — Stage B",  status: "todo",        due: "Aug 22",        assigned: "You" },
];

const EVENT_FILTERS = ["All events", "NorthStar Summit", "Lumen Design Festival", "DevConnect Winter"];

const TASK_STATUS: Record<string, "green" | "blue" | "gray"> = {
  done: "green",
  "in-progress": "blue",
  todo: "gray",
};

const TASK_LABEL: Record<string, string> = {
  done: "Done",
  "in-progress": "In progress",
  todo: "To do",
};

export default function HandlerTasksPage() {
  const [eventFilter, setEventFilter] = useState("All events");

  const tasks = eventFilter === "All events"
    ? ALL_TASKS
    : ALL_TASKS.filter((t) => t.event === eventFilter);

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="My Tasks" sub="All tasks across your assigned events" />

      {/* Event filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {EVENT_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setEventFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-sm font-bold border transition-all cursor-pointer"
            style={{
              background: eventFilter === f ? "var(--primary-hex,#6366f1)" : "var(--surface)",
              borderColor: eventFilter === f ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
              color: eventFilter === f ? "#fff" : "var(--text-muted)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks grouped by status */}
      {(["in-progress", "todo", "done"] as const).map((status) => {
        const group = tasks.filter((t) => t.status === status);
        if (group.length === 0) return null;
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge variant={TASK_STATUS[status]}>{TASK_LABEL[status]}</StatusBadge>
              <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>{group.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {group.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)] border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm" style={{ color: "var(--text-strong)" }}>{t.task}</span>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0"
                    style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
                  >
                    {t.event}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{t.due}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>No tasks for this event.</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
