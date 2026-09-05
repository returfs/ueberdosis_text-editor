import { useCallback, useEffect, useState } from 'react';
import type { DocumentType } from '../document-types';
import type { EditorBridge } from '../types';

/**
 * Reading a document's bytes, for the modes that need the file itself rather
 * than a collaboration session: the viewer, and the source view.
 *
 * The editor never comes through here — in a collaborative session the sync
 * server reads the file and seeds the room, and the browser only ever sees Yjs
 * updates. That is the point of landing in a viewer: looking at a file costs a
 * single GET instead of a websocket, an editor and a room.
 */

export const API_BASE =
  (import.meta.env.VITE_RETURFS_API_URL as string | undefined) ||
  'https://project.test';

/** A developer's own key, used only when running the extension standalone. */
export const DEV_API_KEY = import.meta.env.VITE_RETURFS_API_KEY as
  string | undefined;

/**
 * The resource endpoint for this item.
 *
 * `/collab` is collab-token-only and `/developer` is `rfsk_`-only; each is
 * scoped to the authenticated user server-side, so which path we take is
 * decided by which credential we hold, never by the caller.
 */
export function resourceRoute(id: string, viaCollab: boolean): string {
  return `${API_BASE}/api/v1/${viaCollab ? 'collab' : 'developer'}/item-instances/${id}/resource`;
}

/**
 * What the host's collab-token mint answers: a short-lived per-user,
 * per-resource token, or a refusal saying the file is end-to-end encrypted.
 * Encrypted files never ride the sync server (it only handles plaintext), so
 * this doubles as the probe for which mode a document opens in.
 */
export interface CollabGrant {
  token?: string;
  e2ee: boolean;
  /**
   * What this user may do with the file. Shares are read-only, so this is what
   * decides whether Edit is offered at all — better than opening an editor
   * that turns out not to be able to save.
   */
  writable: boolean;
}

export async function mintCollabToken(url: string): Promise<CollabGrant> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error('Failed to obtain collaboration token');

  const json = await response.json();
  const payload = json?.data ?? json;

  return {
    token: payload?.token,
    e2ee: Boolean(payload?.e2ee),
    // An encrypted file answers with the flag alone and is opened through the
    // host bridge, which only hands over files the user can already open.
    writable: payload?.e2ee ? true : payload?.perms !== 'read',
  };
}

/** Base64 → text, via bytes: `atob` alone mangles anything outside Latin-1. */
function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export type ResourceState = 'loading' | 'ready' | 'error' | 'needs-app';

/**
 * The opened file's text.
 *
 * Three ways in, in the order they are tried:
 *  - encrypted, in the app — the host bridge hands us decrypted bytes;
 *  - collaborative — a minted token reads the resource endpoint;
 *  - standalone dev — the developer's own key does, against `/developer`.
 */
export function useResourceText({
  resourceId,
  collabTokenUrl,
  bridge,
  documentType,
}: {
  resourceId?: string;
  collabTokenUrl?: string;
  bridge?: EditorBridge;
  documentType: DocumentType;
}): {
  text: string | null;
  state: ResourceState;
  /** True when the file is end-to-end encrypted (the editor takes local mode). */
  e2ee: boolean;
  /** False for a file shared with this user: they may read it, not change it. */
  writable: boolean;
  reload: () => void;
} {
  const documentTypeId = documentType.id;

  const [text, setText] = useState<string | null>(null);
  const [state, setState] = useState<ResourceState>('loading');
  const [e2ee, setE2ee] = useState(false);
  const [writable, setWritable] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce(current => current + 1), []);

  useEffect(() => {
    if (!resourceId) return;

    let cancelled = false;
    setState('loading');

    (async () => {
      try {
        const grant: CollabGrant = collabTokenUrl
          ? await mintCollabToken(collabTokenUrl)
          : { e2ee: false, token: DEV_API_KEY, writable: true };

        if (cancelled) return;
        setE2ee(grant.e2ee);
        setWritable(grant.writable);

        if (grant.e2ee) {
          // Only the host can decrypt. Standalone dev has no bridge, so there
          // is genuinely nothing to show rather than an error to retry.
          if (!bridge) {
            setState('needs-app');
            return;
          }

          const blob = await bridge.getResource();
          const decrypted = await blob.text();
          if (cancelled) return;

          setText(decrypted);
          setState('ready');
          return;
        }

        const url = new URL(resourceRoute(resourceId, Boolean(collabTokenUrl)));
        url.searchParams.set('document_type', documentTypeId);

        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
            ...(grant.token ? { Authorization: `Bearer ${grant.token}` } : {}),
          },
        });

        if (!response.ok)
          throw new Error(`Resource read failed: ${response.status}`);

        const json = await response.json();
        const item = json?.data?.item ?? json?.item;
        if (cancelled) return;

        setText(
          item?.encoding === 'base64'
            ? decodeBase64(item.content ?? '')
            : (item?.content ?? ''),
        );
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
    // The id, not the document type itself: it is the only part of it this
    // read uses, and depending on the object makes correctness here rest on
    // every caller handing over a stable one. One that did not turned this
    // into a fetch loop.
  }, [resourceId, collabTokenUrl, bridge, documentTypeId, nonce]);

  return { text, state, e2ee, writable, reload };
}
