import ExtensionKit from '@/extensions/extension-kit';
import { docToMarkdown, markdownToDoc } from '@returfs/markdown-doc';
import type { RichDocumentType } from './types';

/**
 * The markdown document type.
 *
 * Same editor as plain text — a `.md` file is edited as the document it
 * describes, not as its own syntax — but the file it reads and writes is real
 * markdown. Without this, a `.md` opened here would show `# Heading` as those
 * literal characters and, worse, would save back with every heading, list and
 * link flattened out of the file.
 *
 * The conversion is `@returfs/markdown-doc`, shared with the Hocuspocus sync
 * server: in a collaborative session the server writes the file, in an
 * encrypted one the browser does, and the two must produce the same bytes.
 */
export const markdownDocumentType: RichDocumentType = {
  surface: 'rich',
  id: 'markdown',
  // Markdown shares text's `.rtxt`: the sidecar holds Yjs state, which has the
  // same shape whatever the plain file beside it looks like.
  richExtension: 'rtxt',
  exportExtension: 'md',
  mimeType: 'text/markdown',
  label: 'Markdown document',
  extensions: options => ExtensionKit(options),
  toDoc: markdownToDoc,
  fromDoc: editor => docToMarkdown(editor.getJSON()),
};
