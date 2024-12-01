import React, { memo, StrictMode, useMemo } from 'react';
import BlockEditor from './BlockEditor';
import {
  ColorKey,
  Entrance,
  PortalSystemProps,
} from '@returfs/shared-external-react';
// import { Doc as YDoc } from 'yjs';

import '../css/app.css';
import '@returfs/shared-external-react/dist/index.css';

export default memo(function Extension({
  resourceRoute,
  settings,
}: PortalSystemProps) {
  console.log('resourceRoute', resourceRoute);

  //   const ydoc = useMemo(() => new YDoc(), []);

  const themeColor = ColorKey.Gray;

  return (
    <StrictMode>
      <Entrance themeColor={themeColor}>
        <BlockEditor
          resourceRoute={resourceRoute}
          settings={settings}
          // ydoc={ydoc}
        />
      </Entrance>
    </StrictMode>
  );
});
