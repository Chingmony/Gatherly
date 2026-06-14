"use client";

import { useState } from "react";
import { Search, Download, QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Segmented } from "@/components/ui/segmented";

const GUESTS = [
  { id: "g1", name: "Clara Bennett",   email: "clara@email.com",  registered: "Jun 1, 2026",  status: "confirmed", checkin: "" },
  { id: "g2", name: "Rayan Osei",      email: "rayan@email.com",  registered: "Jun 2, 2026",  status: "confirmed", checkin: "Jun 18 9:12 AM" },
  { id: "g3", name: "Mia Johansson",   email: "mia@email.com",    registered: "Jun 3, 2026",  status: "confirmed", checkin: "Jun 18 9:18 AM" },
  { id: "g4", name: "James Obi",       email: "james@email.com",  registered: "Jun 5, 2026",  status: "cancelled", checkin: "" },
  { id: "g5", name: "Priya Nair",      email: "priya@email.com",  registered: "Jun 6, 2026",  status: "confirmed", checkin: "Jun 18 9:45 AM" },
  { id: "g6", name: "Lucas Moreau",    email: "lucas@email.com",  registered: "Jun 8, 2026",  status: "confirmed", checkin: "" },
  { id: "g7", name: "Anika Svensson",  email: "anika@email.com",  registered: "Jun 10, 2026", status: "confirmed", checkin: "" },
];

const STATUS_VARIANT: Record<string, "green" | "gray" | "danger"> = {
  confirmed: "green",
  cancelled: "danger",
  pending:   "gray",
};

const FILTER_OPTIONS = [
  { id: "all",        label: "All" },
  { id: "checked-in", label: "Checked in" },
  { id: "confirmed",  label: "Confirmed" },
  { id: "cancelled",  label: "Cancelled" },
];

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = GUESTS.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "checked-in" && g.checkin) ||
      (filter === "confirmed" && g.status === "confirmed") ||
      (filter === "cancelled" && g.status === "cancelled");
    return matchSearch && matchFilter;
  });

  const checkedIn = GUESTS.filter((g) => g.checkin).length;

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Guests" sub="Registration list and attendance">
        <Button variant="ghost" size="sm">
          <Download size={13} /> Export CSV
        </Button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total registered", value: GUESTS.length,                   color: "var(--text-strong)" },
          { label: "Checked in",       value: checkedIn,                       color: "var(--green-600)" },
          { label: "Cancelled",        value: GUESTS.filter(g => g.status === "cancelled").length, color: "var(--danger)" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="px-5 py-4">
              <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Segmented
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
        <div className="relative sm:ml-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            type="search"
            placeholder="Search guests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                  {["Guest", "Registered", "Status", "Checked in", "Ticket"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      No guests found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((g, i) => (
                    <tr
                      key={g.id}
                      className="transition-colors hover:bg-[var(--surface-2)]"
                      style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AvatarUser name={g.name} size={34} />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold" style={{ color: "var(--text-strong)" }}>{g.name}</span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{g.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{g.registered}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge variant={STATUS_VARIANT[g.status] ?? "gray"}>
                          {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3.5">
                        {g.checkin ? (
                          <span className="text-xs font-semibold" style={{ color: "var(--green-600)" }}>{g.checkin}</span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Button variant="ghost" size="icon-sm" title="View ticket">
                          <QrCode size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
