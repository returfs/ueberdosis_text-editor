import React, { memo, StrictMode, useMemo } from 'react';
import BlockEditor from './BlockEditor';
import {
  ColorKey,
  Entrance,
  PortalSystemProps,
  ResourceSettingsData,
} from '@returfs/shared-external-react';

import '../css/app.css';

export default memo(function Extension({
  resourceItem,
  resourceSettings,
  resourceUser,
}: PortalSystemProps) {
  return (
    <StrictMode>
      <Entrance
        themeColor={
          resourceSettings?.[ResourceSettingsData.ThemeColor] as ColorKey
        }
      >
        <BlockEditor resourceItem={resourceItem} resourceUser={resourceUser} />
      </Entrance>
    </StrictMode>
  );
});
