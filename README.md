# Text Editor Extension

Collaborative rich text editor for Returfs, powered by Tiptap and Hocuspocus.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start in standalone development mode
pnpm dev

# Start in federated mode (for host integration)
pnpm dev:federated
```

## Development

### Standalone Mode (Recommended)

Standalone mode runs the extension independently with the real Returfs API:

1. Copy `.env.example` to `.env.local`
2. Add your Developer API key from the Returfs dashboard
3. Run `pnpm dev`
4. The DevWrapper will prompt you to select an item to edit

```bash
cp .env.example .env.local
# Edit .env.local with your API key
pnpm dev
```

### Federated Mode

Federated mode runs the extension as a Module Federation remote for integration testing with the host application:

```bash
pnpm dev:federated
```

The extension will be available at `http://localhost:7003/remoteEntry.js`

## Building

```bash
# Build for standalone deployment
pnpm build

# Build for federated deployment
pnpm build:federated
```

## Architecture

This extension uses **self-managed updates** via Hocuspocus WebSocket:

- Real-time collaborative editing with Yjs
- Persistence handled by Hocuspocus server
- Does not use the host bridge for data persistence

### Structure

```
text-editor/
├── src/
│   ├── main.tsx           # Entry point (uses createExtensionRoot)
│   ├── Extension.tsx      # Main extension component + manifest
│   ├── components/
│   │   └── BlockEditor.tsx  # Tiptap editor wrapper
│   └── styles/
│       └── app.css
├── vite.config.ts         # Unified Vite configuration
├── index.html             # For federated mode
├── index.dev.html         # For standalone mode
└── package.json
```

## Migrating from old-internal

To use the full Tiptap editor implementation:

1. Copy these directories from `old-internal/ueberdosis/text-editor/resources/js/`:
   - `components/`
   - `extensions/`
   - `hooks/`
   - `lib/`
   - `helpers/`

2. Copy styles from `old-internal/ueberdosis/text-editor/resources/css/`

3. Update imports to use `@/` alias

## License

Proprietary - Ueberdosis
