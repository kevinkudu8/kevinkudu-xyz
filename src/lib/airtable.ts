const API = "https://api.airtable.com/v0";

export type AirtableRecord<F> = { id: string; fields: F };

/**
 * Read an env var, forgiving common dashboard paste mistakes: surrounding
 * whitespace or quotes, or the whole `NAME=value` line pasted as the value.
 */
export function env(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(new RegExp(`^${name}=`), "").replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
}

export function airtableConfig() {
  const token = env("AIRTABLE_TOKEN");
  const baseId = env("AIRTABLE_BASE_ID");
  if (!token || !baseId) return null;
  return { token, baseId };
}

/** True while `next build` is prerendering, as opposed to serving requests. */
export const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * Fetch every record in a table, following pagination. Only the named fields
 * are requested, so anything else in the table never leaves Airtable.
 */
export async function listRecords<F>(
  tableId: string,
  fields: readonly string[],
  options: { filterByFormula?: string } = {},
): Promise<AirtableRecord<F>[]> {
  const config = airtableConfig();
  if (!config) throw new Error("Airtable is not configured");

  const records: AirtableRecord<F>[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`${API}/${config.baseId}/${tableId}`);
    url.searchParams.set("pageSize", "100");
    for (const field of fields) url.searchParams.append("fields[]", field);
    if (options.filterByFormula) url.searchParams.set("filterByFormula", options.filterByFormula);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const page = (await res.json()) as { records: AirtableRecord<F>[]; offset?: string };
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}
