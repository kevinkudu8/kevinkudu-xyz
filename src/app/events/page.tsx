import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events-browser";
import { getEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Events" };

const INTRO =
  "Physical spaces around the globe, designed to help brands connect with the people who keep them relevant.";

export default async function EventsPage() {
  return (
    <main className="px-gutter flex-1 py-16 sm:py-24">
      <EventsBrowser events={await getEvents()} intro={INTRO} />
    </main>
  );
}
