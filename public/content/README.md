# Films (/film page)

One folder per film. Order, title and details live in `film.md`.

    public/content/like-water/
      film.md        details and a one- or two-sentence description
      still.jpg      the 16:9 still shown on the card (Vimeo thumbnails work well)
      preview.mp4    optional: short silent loop that plays on hover
      video.mp4      optional: the full film, opened on click

`film.md` looks like:

    ---
    title: Like Water - Garçons
    order: 2
    year: 2023
    role: Director & DP
    runtime: 2:40
    type: Short film
    sample: true        (shows a "Sample content" tag; delete once details are real)
    ---

    One or two sentences about the film.

Instead of video.mp4 you can link a hosted video (YouTube or Vimeo) by adding
`link: https://...` to film.md; it plays in the full-screen viewer.

commissioned.json powers the unlisted /web3 page (not in the nav, noindex).
