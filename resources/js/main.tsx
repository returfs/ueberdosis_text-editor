import React from 'react';
import { createRoot } from 'react-dom/client';
import Extension from './Extension';

import '@returfs/shared-external-react/dist/index.css';
import {
  ColorKey,
  HexColorKey,
  SettingsData,
} from '@returfs/shared-external-react';

const resourceRoute = 'http://project.test/api/dummy/txt';

createRoot(document.getElementById('root')!).render(
  <Extension
    item={{ id: 'txt' }}
    resourceRoute={resourceRoute}
    settings={{ [SettingsData.ThemeColor]: ColorKey.Gray }}
    user={{ name: 'badasukerubin', color: HexColorKey.Gray }}
  />,
);
