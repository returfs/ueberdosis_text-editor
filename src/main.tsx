/**
 * Text Editor Extension - Main Entry Point
 *
 * This single file works for both standalone and federated modes.
 * The SDK automatically detects the mode and renders appropriately:
 * - Standalone: Shows DevWrapper with API key auth and item picker
 * - Federated: Renders directly with props from the host
 */

import { createExtensionRoot } from '@returfs/extension-sdk';
import Extension, { manifest } from './Extension';

import '@returfs/shared-external-react/style.css';

// Mount the extension
createExtensionRoot(Extension, {
  manifest,
  defaultSettings: {
    'theme-color': 'gray',
  },
});
