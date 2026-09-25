/** What a shelf card needs, whatever the source (Airtable books, Letterboxd films). */
export type ShelfItem = {
  id: string;
  title: string;
  byline: string;
  meta: string;
  favourite: boolean;
  image: string | null;
  /** Image width / height; drawn at this shape rather than cropped to 2:3 */
  aspect?: number | null;
  /** Serve as-is rather than through the Next image optimizer */
  imageUnoptimized?: boolean;
  href?: string;
};
