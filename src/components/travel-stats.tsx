import { TravelStatsView } from "@/components/travel-stats-view";
import { getTravelStats } from "@/lib/travel";

export function TravelStats() {
  return <TravelStatsView stats={getTravelStats()} />;
}
