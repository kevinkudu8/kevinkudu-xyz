# Events content

One folder per event. The folder name becomes the link (`/events#folder-name`).

    public/events/crypto-com-x-ufc/
      event.md      title, order and write-up
      01.jpg        first image is the large one at the top
      02.jpg ...    the rest form a gallery below the write-up (sorted by file name)

`event.md` looks like:

    ---
    title: Crypto.com x UFC
    order: 2
    featured: true      (optional: shown first when the page opens)
    client: Crypto.com
    role: Event execution
    location: Las Vegas
    year: 2024
    stats: 1,650 = Sign-ups; 2,750 = Branded items; 22M = Impressions; 3 = Days
    sample: true        (shows a "Sample content" tag; delete once details are real)
    hidden: true        (optional: leaves the event off the site; delete to show it again)
    scene: pyusd-booth  (optional: a 3D model in place of the first photo; all photos go to the gallery)
    map: true           (optional: plays the timeline's places on a world map; places are listed in src/lib/program-map.ts)
    ---

    First paragraph of the write-up.

    Second paragraph (separate paragraphs with a blank line).

Images: .jpg, .jpeg, .png, .webp or .avif. Any size; they're cropped to fit.

`spotlight.json` (optional) tells one piece of work step by step, with its
own photos (which then aren't repeated in the gallery). It can also be a
list, for more than one spotlight.
