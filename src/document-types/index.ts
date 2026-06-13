export type { DocumentType } from './types';
export { textDocumentType } from './text';

import { textDocumentType } from './text';

/** The document type this package operates as. The form-builder package swaps
 *  this for its own descriptor; the core never hardcodes type-specifics. */
export const DEFAULT_DOCUMENT_TYPE = textDocumentType;
