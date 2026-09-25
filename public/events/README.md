# Events content

One folder per event. The folder name becomes the link (`/events#folder-name`).

    public/events/crypto-com-x-ufc/
      event.md      title, order and write-up
      01.jpg        first image is the large one
      02.jpg ...    the rest become thumbnails (sorted by file name)

`event.md` looks like:

    ---
    title: Crypto.com x UFC
    order: 2
    featured: true      (optional: shown first when the page opens)
    ---

    First paragraph of the write-up.

    Second paragraph (separate paragraphs with a blank line).

Images: .jpg, .jpeg, .png, .webp or .avif. Any size; they're cropped to fit.
