import { ColorKey, ResourceSettingsData } from '@returfs/shared-external-react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Extension from './Extension';

import '@returfs/shared-external-react/dist/index.css';

createRoot(document.getElementById('root')!).render(
  <Extension
    resourceItem={{
      id: 'txt',
      created_at: '2023-10-01 12:00:00',
      updated_at: '2023-10-01 12:00:00',
      name: 'Test',
      extension: 'txt',
      route: 'http://project.test/api/dummy/txt',
      updateRoute: 'http://project.test/api/dummy/update',
    }}
    resourceUser={{
      id: 'badasukerubin',
      name: 'badasukerubin',
      username: 'badasukerubin',
      created_at: '2023-10-01 12:00:00',
      updated_at: '2023-10-01 12:00:00',
    }}
    resourceSettings={{ [ResourceSettingsData.ThemeColor]: ColorKey.Gray }}
  />,
);
