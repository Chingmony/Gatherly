import type { Metadata } from "next";
import { ExploreView } from "./explore-view";

export const metadata: Metadata = { title: "Discover events" };

export default function ExplorePage() {
  return <ExploreView />;
}
