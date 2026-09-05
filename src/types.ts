import { ResourceItem, ResourceUser } from '@returfs/shared-external-react';
import type { JSONContent } from '@tiptap/core';

/** The sealed transport the host offers for e2ee collab (Phase 5A). */
export interface DocRelayConnection {
  send: (kind: string, payload: Uint8Array) => void;
  leave: () => void;
}

/**
 * The slice of the host bridge the editor's e2ee modes use: reads arrive
 * decrypted (the host decrypts e2ee resources at its read choke point),
 * writes are encrypted host-side before they are stored, and `joinDocRelay`
 * joins the blind relay channel over which peers exchange Yjs updates that
 * the host seals with the file's own key. The relay is optional: an older
 * host (or a failed join) degrades to solo local editing.
 */
export interface EditorBridge {
  getResource: () => Promise<Blob>;
  updateResource: (data: File | Blob | string) => Promise<void>;
  joinDocRelay?: (handlers: {
    onMessage: (kind: string, payload: Uint8Array) => void;
  }) => Promise<DocRelayConnection>;
  /**
   * Client-encrypted rich sidecar: the editor's Yjs state stored as
   * ciphertext, hash-bound host-side to the plain text so stale rich state
   * is ignored. Read resolves null when there is nothing usable.
   */
  readDocSidecar?: (plainText: string) => Promise<Uint8Array | null>;
  writeDocSidecar?: (rich: Uint8Array, plainText: string) => Promise<void>;
}

export interface BlockEditorProps {
  resourceItem: ResourceItem;
  resourceUser: ResourceUser;
  /** Host bridge — required for the e2ee modes, unused by collab. */
  bridge?: EditorBridge;
  /**
   * Leave the editor and go back to reading.
   *
   * Hands over the bytes the file would be written as, so the view shows what
   * was just typed rather than re-reading a file the sync server writes on a
   * debounce. Rich documents hand over the ProseMirror document too, so the
   * rendered view does not have to reparse what the editor already had; the
   * code surface has no such thing, because there the bytes ARE the document.
   */
  onDone?: (result: { plain: string; document?: JSONContent }) => void;
}
