import { airtableTableId, listRecords } from "@/lib/airtable";

type Attachment = { url: string; thumbnails?: { large?: { url: string } } };

/**
 * Serves a book's Airtable attachment. Airtable's attachment URLs expire after
 * a few hours, so the page links here and this looks up a fresh URL, letting
 * the CDN cache the image itself.
 */
export async function GET(_request: Request, ctx: RouteContext<"/covers/[id]">) {
  const { id } = await ctx.params;
  const tableId = airtableTableId();
  if (!/^rec[A-Za-z0-9]{14}$/.test(id) || !tableId) {
    return new Response("Not found", { status: 404 });
  }

  const [record] = await listRecords<{ Attachments?: Attachment[] }>(tableId, ["Attachments"], {
    filterByFormula: `RECORD_ID()='${id}'`,
  }).catch(() => []);
  const attachment = record?.fields.Attachments?.[0];
  if (!attachment) return new Response("Not found", { status: 404 });

  const image = await fetch(attachment.thumbnails?.large?.url ?? attachment.url, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!image.ok || !image.body) return new Response("Bad gateway", { status: 502 });

  return new Response(image.body, {
    headers: {
      "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
