import React from 'react';
import { createRoot } from 'react-dom/client';
import Extension from './Extension';

import '../css/app.css';

const resourceRoute = 'http://project.test/api/dummy/txt';

function onUpdate() {
  console.log('onUpdate');
}

createRoot(document.getElementById('root')!).render(
  <Extension
    item={{
      id: 'txt',
    }}
    resourceRoute={resourceRoute}
    settings={'test'}
    onUpdate={onUpdate}
  />,
);
