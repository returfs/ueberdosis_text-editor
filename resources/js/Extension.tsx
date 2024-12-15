import React, { memo, StrictMode, useMemo } from 'react';
import BlockEditor from './BlockEditor';
import {
  ColorKey,
  Entrance,
  PortalSystemProps,
} from '@returfs/shared-external-react';
// import { Doc as YDoc } from 'yjs';

export default memo(function Extension({
  item,
  resourceRoute,
  settings,
  onUpdate,
}: PortalSystemProps) {
  console.log('resourceRoute', resourceRoute);

  //   const ydoc = useMemo(() => new YDoc(), []);

  const themeColor = ColorKey.Gray;

  return (
    <StrictMode>
      <Entrance themeColor={themeColor}>
        <BlockEditor
          item={item}
          resourceRoute={resourceRoute}
          settings={settings}
          onUpdate={onUpdate}
          // ydoc={ydoc}
        />
      </Entrance>
    </StrictMode>
  );
});
