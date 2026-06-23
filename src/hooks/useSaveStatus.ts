import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider';
import { useEffect, useState } from 'react';

/**
 * Coarse save/connection state for the editor's status indicator.
 *
 * "saved" means all local edits have been synced to the collaboration server
 * (which then persists them via its debounced store) — the same meaning as
 * Google Docs' "All changes saved". It does NOT wait on the server's DB write.
 */
export type SaveState =
  | 'connecting' // first connection / reconnecting — not yet usable
  | 'saving' // connected but local changes not yet acked by the server
  | 'saved' // connected + synced + nothing pending
  | 'offline' // socket dropped; edits buffer locally and flush on reconnect
  | 'error'; // authentication/connection rejected — won't retry

/**
 * Track the provider's connection + sync state and expose a single SaveState.
 * Listens to the provider events (status / synced / unsyncedChanges / auth) so
 * the indicator updates live without polling.
 */
export function useSaveStatus(provider: HocuspocusProvider | null): SaveState {
  const [state, setState] = useState<SaveState>('connecting');

  useEffect(() => {
    if (!provider) return;

    let authFailed = false;

    const compute = (): SaveState => {
      if (authFailed) return 'error';

      switch (provider.status) {
        case WebSocketStatus.Connecting:
          return 'connecting';
        case WebSocketStatus.Disconnected:
          return 'offline';
        default:
          // Connected: pending local changes (or not-yet-synced) => saving.
          return !provider.isSynced || provider.unsyncedChanges > 0
            ? 'saving'
            : 'saved';
      }
    };

    const update = () => setState(compute());
    const onConnect = () => {
      authFailed = false;
      update();
    };
    const onAuthenticated = () => {
      authFailed = false;
      update();
    };
    const onAuthFailed = () => {
      authFailed = true;
      update();
    };

    provider.on('status', update);
    provider.on('synced', update);
    provider.on('unsyncedChanges', update);
    provider.on('disconnect', update);
    provider.on('connect', onConnect);
    provider.on('authenticated', onAuthenticated);
    provider.on('authenticationFailed', onAuthFailed);

    update();

    return () => {
      provider.off('status', update);
      provider.off('synced', update);
      provider.off('unsyncedChanges', update);
      provider.off('disconnect', update);
      provider.off('connect', onConnect);
      provider.off('authenticated', onAuthenticated);
      provider.off('authenticationFailed', onAuthFailed);
    };
  }, [provider]);

  return state;
}
