import type { AnyExtension, Editor, JSONContent } from '@tiptap/core';

/**
 * Document-type framework (Phase D5)
 *
 * A `DocumentType` is the single place that captures everything specific to a
 * kind of document. The editor core is generic and reads its behaviour from the
 * active DocumentType, so a new variant does not fork the core.
 *
 * The `id` is the contract shared with the rest of the stack: it is sent to the
 * Hocuspocus sync server (to pick the right flatten/hydrate) and to the Laravel
 * resource API (to pick the rich sidecar's extension). Keep ids stable.
 *
 * A type also names the SURFACE that renders it. Two exist, and they have
 * genuinely different jobs:
 *
 *  - `rich` — a ProseMirror document. The file is a projection of it (plain
 *    lines for `.txt`, markdown for `.md`) and formatting the file cannot hold
 *    lives in the hidden rich sidecar.
 *  - `code` — the file's bytes ARE the document. Nothing is parsed, nothing is
 *    projected, nothing is escaped. A source file that came back reformatted
 *    would be a broken file, so this surface is byte-exact by construction.
 */

/** What every document type carries, whichever surface renders it. */
export interface BaseDocumentType {
  /** Stable identifier, also sent to Hocuspocus + Laravel. */
  id: string;

  /** Rich sidecar extension (no dot), e.g. 'rtxt'. Informational on the
   *  client; the server maps id → extension authoritatively. */
  richExtension: string;

  /** Portable export extension (no dot), e.g. 'txt' | 'php'. */
  exportExtension: string;

  /** MIME type to save the plain file as. */
  mimeType: string;

  /** Human label for the type (UI / docs). */
  label: string;
}

/** A document edited as rich text through Tiptap. */
export interface RichDocumentType extends BaseDocumentType {
  surface: 'rich';

  /** The editor schema (non-collaboration Tiptap extensions) for this type.
   *   opts StarterKit undo back in for the local (non-Yjs) mode. */
  extensions: (options?: { history?: boolean }) => AnyExtension[];

  /**
   * The file's bytes → the document to seed an editor with.
   *
   * Collaborative documents are seeded by the sync server instead, which runs
   * the same conversion; this is the path for the modes that have no server —
   * end-to-end encrypted files, and the source view.
   */
  toDoc: (plain: string) => JSONContent;

  /**
   * The document → the bytes to write to the file.
   *
   * Takes the editor rather than its JSON so a type can use whichever it needs:
   * plain text reads the rendered text, markdown reads the document structure.
   */
  fromDoc: (editor: Editor) => string;
}

/**
 * A document edited as source through CodeMirror.
 *
 * There is one code type rather than one per language: the language only picks
 * syntax highlighting, and highlighting is a property of the file being looked
 * at, not of how it is stored. The whole type is otherwise the identity
 * function — which is exactly what a `.php` file wants from an editor.
 */
export interface CodeDocumentType extends BaseDocumentType {
  surface: 'code';

  /** The opened file's own extension, which chooses the highlighting. */
  fileExtension: string;
}

export type DocumentType = RichDocumentType | CodeDocumentType;
