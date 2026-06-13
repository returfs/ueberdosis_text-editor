import ExtensionKit from '@/extensions/extension-kit';
import type { DocumentType } from './types';

/**
 * The text document type — the concrete DocumentType this package ships.
 *
 * The form-builder package (D6) is a separate package that replicates this one
 * and provides its own descriptor (id 'form', `.rform` / `.csv`, a form schema)
 * in place of this file. Everything text-specific lives here.
 */
export const textDocumentType: DocumentType = {
  id: 'text',
  richExtension: 'rtxt',
  exportExtension: 'txt',
  label: 'Text document',
  extensions: () => ExtensionKit(),
};
