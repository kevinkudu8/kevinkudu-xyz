const API = "https://api.airtable.com/v0";

export type AirtableRecord<F> = { id: string; fields: F };

export function airtableConfig() {
  const { AIRTABLE_TOKEN, AIRTABLE_BASE_ID } = process.env;
  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) return null;
  return { token: AIRTABLE_TOKEN, baseId: AIRTABLE_BASE_ID };
}

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
