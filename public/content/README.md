# Content (films)

One folder per film. Order, title and details live in `film.md`.

    public/content/low-tide/
      film.md        details and a one- or two-sentence description
      poster.jpg     the still shown on the card (portrait works best)
      preview.mp4    optional: short silent loop that plays on hover
      video.mp4      optional: the full film, opened on click

`film.md` looks like:

    ---
    title: Low Tide
    order: 2
    year: 2023
    role: Director & DP
    runtime: 2:40
    type: Short film
    sample: true        (shows a "Sample content" tag; delete once details are real)
    ---

    One or two sentences about the film.

Instead of video.mp4 you can link a hosted video (YouTube or Vimeo) by adding
`link: https://...` to film.md; the card then opens that link.
