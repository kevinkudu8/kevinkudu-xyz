import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events-browser";
import { getEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Events" };

const INTRO =
  "Physical spaces created around the globe. Designed to improve how brands and companies connect with the people keeping them relevant.";

export default function EventsPage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <EventsBrowser events={getEvents()} intro={INTRO} />
    </main>
  );
}
