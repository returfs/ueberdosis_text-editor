// Extension manifest — the extension's identity (name, version, author, …),
// surfaced to the host and to the App menu / About dialog. Kept in its own module
// so both Extension.tsx and the menu-bar builder can import it without a cycle.
export const manifest = {
  id: 'ueberdosis_text-editor',
  name: 'text-editor',
  displayName: 'Text Editor',
  version: '1.0.0',
  description: 'Collaborative rich text editor',
  author: 'Ueberdosis',
  type: 'internal-returfs',

  // Capabilities this extension requires
  capabilities: ['read-resource', 'write-resource', 'realtime-collaboration'],

  // This extension manages its own updates via Hocuspocus
  updateStrategy: 'self-managed',

  // Supported file types
  supportedTypes: [
    'text/plain',
    'text/html',
    'text/markdown',
    'application/json',
  ],

  // Hocuspocus specific configuration
  realtimeConfig: {
    provider: 'hocuspocus',
    requiresWebSocket: true,
  },
};
