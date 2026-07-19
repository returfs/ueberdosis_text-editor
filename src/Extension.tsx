import { memo } from 'react';
import BlockEditor from './BlockEditor';
import {
  ColorKey,
  Entrance,
  PortalSystemProps,
  ResourceSettingsData,
} from '@returfs/shared-external-react';

import './styles/app.css';

// Extension manifest for the host application, re-exported from its own module
// (see ./manifest) alongside the default component.
export { manifest } from './manifest';

/**
 * Text Editor Extension Component
 *
 * This is a self-managed extension that uses Hocuspocus for real-time
 * collaborative editing. It does not use the parent bridge for data
 * persistence - all updates go through the WebSocket connection.
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
  // These props are provided by the new extension system
  // but we don't use bridge for updates since we use Hocuspocus
  bridge: _bridge,
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
      <BlockEditor resourceItem={resourceItem} resourceUser={resourceUser} />
    </Entrance>
  );
});
