import { memo } from 'react';
import TextDocument from './TextDocument';
import type { EditorBridge } from './types';
import {
  ColorKey,
  Entrance,
  PortalSystemProps,
  ResourceSettingsData,
} from '@returfs/shared-external-react';

import './lib/i18n';
import './styles/app.css';

// Extension manifest for the host application, re-exported from its own module
// (see ./manifest) alongside the default component.
export { manifest } from './manifest';

/**
 * Text Editor Extension Component
 *
 * A self-managed extension: an opened file lands in a read-only view, and
 * editing — which is where Hocuspocus, Yjs and the whole editor come in — is
 * an explicit step from there. Collaborative documents persist through the
 * WebSocket connection rather than the parent bridge; encrypted ones use the
 * bridge, because the host is the only thing that can decrypt them.
 *
 * Props:
 * - resourceItem: The item being edited
 * - resourceUser: The current user
 * - resourceSettings: User preferences/settings
 * - bridge: (optional) Host bridge for notifications/settings (not used for data)
 * - manifest: (optional) Extension manifest from host
 * - config: (optional) Extension configuration from host
 */
export default memo(function Extension({
  resourceItem,
  resourceSettings,
  resourceUser,
  // Collab documents persist via Hocuspocus, not the bridge; the bridge IS
  // used by the local mode for end-to-end encrypted files (the host decrypts
  // reads and encrypts writes).
  bridge,
  manifest: _manifest,
  config: _config,
}: PortalSystemProps & {
  bridge?: unknown;
  manifest?: unknown;
  config?: unknown;
}) {
  return (
    <Entrance
      themeColor={
        resourceSettings?.[ResourceSettingsData.ThemeColor] as ColorKey
      }
    >
      <TextDocument
        resourceItem={resourceItem}
        resourceUser={resourceUser}
        bridge={bridge as EditorBridge | undefined}
      />
    </Entrance>
  );
});
