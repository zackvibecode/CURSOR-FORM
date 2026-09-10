/**
 * Shared Meta Pixel / Conversions API types.
 * Safe for both client and server imports.
 */

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "Contact"
  | "Search"
  | "InitiateCheckout"
  | "Purchase";

export type MetaEventName = MetaStandardEvent | (string & {});

export interface MetaEventParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  form_name?: string;
  source?: string;
  contact_method?: string;
  page_path?: string;
  search_string?: string;
  value?: number;
  currency?: string;
  order_id?: string;
  [key: string]: string | number | string[] | boolean | undefined;
}

export interface MetaTrackOptions {
  /** Shared browser + CAPI event ID for deduplication. */
  eventID?: string;
}

export interface MetaAttributionCookies {
  fbp?: string;
  fbc?: string;
}

export interface MetaCapiLeadPayload {
  pixelId: string;
  eventId: string;
  eventName?: MetaEventName;
  formId?: string;
  formTitle?: string;
  eventSourceUrl: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  customData?: MetaEventParams;
}
