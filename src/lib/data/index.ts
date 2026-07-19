/**
 * The switch.
 *
 * Everything in the UI imports `dataClient` from this file. Flip
 * VITE_USE_HTTP_API=true to swap Supabase → Spring Boot with zero
 * component changes.
 */
import type { DataClient } from "./DataClient";
import { SupabaseDataClient } from "./SupabaseDataClient";
import { HttpDataClient } from "./HttpDataClient";

export const dataClient: DataClient =
  import.meta.env.VITE_USE_HTTP_API === "true"
    ? new HttpDataClient()
    : new SupabaseDataClient();

export type { DataClient } from "./DataClient";
export * from "./contracts";
