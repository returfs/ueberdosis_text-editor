import React, { memo, StrictMode, useMemo } from 'react';
import BlockEditor from './BlockEditor';
import {
  Entrance,
  PortalSystemProps,
  SettingsData,
} from '@returfs/shared-external-react';

import '../css/app.css';

export default memo(function Extension({
  item,
  resourceRoute,
  user,
  settings,
}: PortalSystemProps) {
  console.log('settings', settings);

  return (
    <StrictMode>
      <Entrance themeColor={settings[SettingsData.ThemeColor]}>
        <BlockEditor item={item} user={user} resourceRoute={resourceRoute} />
      </Entrance>
    </StrictMode>
  );
});
