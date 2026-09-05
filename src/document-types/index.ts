export type {
  BaseDocumentType,
  CodeDocumentType,
  DocumentType,
  RichDocumentType,
} from './types';
export { textDocumentType, docFromText } from './text';
export { markdownDocumentType } from './markdown';
export {
  CODE_EXTENSIONS,
  CODE_MIME_TYPES,
  codeDocumentTypeFor,
  isCodeExtension,
} from './code';

import { isMarkdownExtension } from '@returfs/markdown-doc';
import { codeDocumentTypeFor, isCodeExtension } from './code';
import { markdownDocumentType } from './markdown';
import { textDocumentType } from './text';
import type { DocumentType, RichDocumentType } from './types';

/** The type an editor falls back to when the host gave us no file extension. */
export const DEFAULT_DOCUMENT_TYPE = textDocumentType;

/**
 * Which document type an opened file is, decided by its extension.
 *
 * This is the one place the choice is made. The id it yields travels to the
 * sync server (which picks the matching flatten/hydrate) and to Laravel (which
 * picks the rich sidecar), so every editing mode has to resolve it the same
 * way — hence a function rather than a constant per module.
 */
export function documentTypeFor(extension?: string | null): DocumentType {
  if (isMarkdownExtension(extension)) return markdownDocumentType;
  if (isCodeExtension(extension)) return codeDocumentTypeFor(extension);

  return textDocumentType;
}

/**
 * The same choice, narrowed for the Tiptap editors.
 *
 * `TextDocument` routes code files to the code surface before any of them
 * mount, so the fallback here is unreachable in practice. It exists so those
 * components can resolve a type at the top of the function rather than behind a
 * conditional return, which would put their hooks behind a branch.
 */
export function richDocumentTypeFor(
  extension?: string | null,
): RichDocumentType {
  const documentType = documentTypeFor(extension);

  return documentType.surface === 'rich' ? documentType : textDocumentType;
}
