import ExtensionKit from '@/extensions/extension-kit';
import type { JSONContent } from '@tiptap/core';
import type { RichDocumentType } from './types';

/**
 * Plain text → one paragraph per line, the inverse of `getText('\n')`.
 *
 * A `.txt` file has no structure to read, so formatting the user applies lives
 * only in the rich sidecar; the file itself stays the lines they typed.
 */
export function docFromText(text: string): JSONContent {
  const lines = text.length === 0 ? [''] : text.split('\n');

  return {
    type: 'doc',
    content: lines.map(line => ({
      type: 'paragraph',
      content: line === '' ? [] : [{ type: 'text', text: line }],
    })),
  };
}

/**
 * The text document type — the concrete DocumentType this package ships.
 *
 * The form-builder package (D6) is a separate package that replicates this one
 * and provides its own descriptor (id 'form', `.rform` / `.csv`, a form schema)
 * in place of this file. Everything text-specific lives here.
 */
export const textDocumentType: RichDocumentType = {
  surface: 'rich',
  id: 'text',
  richExtension: 'rtxt',
  exportExtension: 'txt',
  mimeType: 'text/plain',
  label: 'Text document',
  extensions: options => ExtensionKit(options),
  toDoc: docFromText,
  fromDoc: editor => editor.getText({ blockSeparator: '\n' }),
};
