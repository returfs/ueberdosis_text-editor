import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useState } from 'react';
import { Doc, encodeStateAsUpdate } from 'yjs';
import type { RichDocumentType } from '@/document-types';

/**
 * Reconciliation (Phase D3)
 *
 * The rich sidecar (.rtxt) is canonical; the plain file is a generated export.
 * If the plain file is edited OUTSIDE the editor (convert, rename, another tool)
 * the server flags `external_change` on load. We then prompt the user, exactly
 * like a desktop editor:
 *
 *  - Keep my version → re-export the rich doc over the plain file (PUT), which
 *    refreshes the stored sourceHash and clears the flag.
 *  - Reload external changes → delete the sidecar (DELETE) and remount the
 *    editor so it re-seeds from the (externally edited) plain file. Formatting
 *    for the changed file is lost — that is the user's explicit choice.
 */

const API_BASE_URL =
  (import.meta.env.VITE_RETURFS_API_URL as string | undefined) ||
  'https://project.test';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface UseReconciliationParams {
  /** GET route for the resource (carries the external_change flag). */
  route?: string;
  /** PUT route for the resource (used by keep-mine). */
  updateRoute?: string;
  /** Async auth-token getter (collab token in prod, dev rfsk_ key standalone). */
  getToken?: () => Promise<string>;
  /** Active document type — selects the sidecar server-side, and decides how
   *  keep-mine exports the document back to the file. */
  documentType: RichDocumentType;
  /** The Tiptap editor — source of the plain export for keep-mine. */
  editor: Editor | null;
  /** The Yjs document — source of the rich state for keep-mine. */
  doc: Doc;
  /** Called after the sidecar is deleted so the host can remount the editor. */
  onReload: () => void;
}

export function useReconciliation({
  route,
  updateRoute,
  getToken,
  documentType,
  editor,
  doc,
  onReload,
}: UseReconciliationParams) {
  const [externalChange, setExternalChange] = useState(false);
  const [busy, setBusy] = useState(false);

  const authHeaders = useCallback(
    async (
      extra: Record<string, string> = {},
    ): Promise<Record<string, string>> => {
      const token = getToken ? await getToken() : '';
      return {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
      };
    },
    [getToken],
  );

  // Append the document type so the server resolves the right rich sidecar.
  const withType = useCallback(
    (url: string): string => {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}document_type=${encodeURIComponent(documentType.id)}`;
    },
    [documentType],
  );

  // Detect external edits on open (and after a reload).
  useEffect(() => {
    if (!route) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(withType(buildUrl(route)), {
          headers: await authHeaders(),
        });
        if (!response.ok) return;
        const data = await response.json();
        const item = data?.data?.item ?? data?.item;
        if (!cancelled) {
          setExternalChange(Boolean(item?.external_change));
        }
      } catch {
        // Detection is best-effort; a failure here must not block editing.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route, authHeaders, withType]);

  // Keep my version: overwrite the plain file with the rich doc's export.
  const keepMine = useCallback(async () => {
    if (!updateRoute || !editor) return;
    setBusy(true);
    try {
      // Export the way this file type is written — markdown for a `.md`, not
      // the stripped text that would erase its headings and links.
      const plain = documentType.fromDoc(editor);
      const content = btoa(unescape(encodeURIComponent(plain)));
      const rich = toBase64(encodeStateAsUpdate(doc));

      await fetch(buildUrl(updateRoute), {
        method: 'PUT',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          content,
          encoding: 'base64',
          rich,
          document_type: documentType.id,
        }),
      });
      setExternalChange(false);
    } finally {
      setBusy(false);
    }
  }, [updateRoute, editor, doc, authHeaders, documentType]);

  // Reload external changes: drop the sidecar, then remount to re-seed from plain.
  const reloadExternal = useCallback(async () => {
    if (!updateRoute) return;
    setBusy(true);
    try {
      await fetch(withType(`${buildUrl(updateRoute)}/sidecar`), {
        method: 'DELETE',
        headers: await authHeaders(),
      });
      setExternalChange(false);
      onReload();
    } finally {
      setBusy(false);
    }
  }, [updateRoute, authHeaders, onReload, withType]);

  return { externalChange, busy, keepMine, reloadExternal };
}
