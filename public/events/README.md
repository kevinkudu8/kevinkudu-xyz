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
    ---

    First paragraph of the write-up.

    Second paragraph (separate paragraphs with a blank line).

Images: .jpg, .jpeg, .png, .webp or .avif. Any size; they're cropped to fit.
