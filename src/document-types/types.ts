import type { AnyExtension } from '@tiptap/core';

/**
 * Document-type framework (Phase D5)
 *
 * A `DocumentType` is the single place that captures everything specific to a
 * kind of document. The editor core (BlockEditor / useBlockEditor / the
 * reconciliation hook) is generic and reads its behaviour from the active
 * DocumentType, so a new variant (e.g. the form builder, shipped as its own
 * package that replicates this one) only needs to provide a different
 * descriptor — it does not fork the core.
 *
 * The `id` is the contract shared with the rest of the stack: it is sent to the
 * Hocuspocus sync server (to pick the right flatten/hydrate) and to the Laravel
 * resource API (to pick the rich sidecar's extension). Keep ids stable.
 */
export interface DocumentType {
  /** Stable identifier, also sent to Hocuspocus + Laravel. E.g. 'text' | 'form'. */
  id: string;

  /** Rich sidecar extension (no dot), e.g. 'rtxt' | 'rform'. Informational on
   *  the client; the server maps id → extension authoritatively. */
  richExtension: string;

  /** Portable export extension (no dot), e.g. 'txt' | 'csv'. */
  exportExtension: string;

  /** Human label for the type (UI / docs). */
  label: string;

  /** The editor schema (non-collaboration Tiptap extensions) for this type. */
  extensions: () => AnyExtension[];
}
