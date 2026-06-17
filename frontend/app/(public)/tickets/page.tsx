import type { Metadata } from "next";
import { TicketsLookupView } from "./tickets-view";

export const metadata: Metadata = { title: "Find your ticket" };

export default function TicketsLookupPage() {
  return <TicketsLookupView />;
}
