import type { CodeDocumentType } from './types';

/**
 * The file kinds that open as source.
 *
 * The value is the MIME type the file is saved back as. Most are `text/plain`:
 * a registered MIME only matters where something downstream (a download, a
 * thumbnail, a converter) keys off it, and inventing `text/x-…` types that no
 * standard defines would be worse than plain text.
 *
 * `.ts` is deliberately absent. It is already claimed by the video editor as an
 * MPEG transport stream, and the two cannot be told apart by name alone — only
 * by sniffing the bytes (a transport stream is 0x47-synced binary). Until that
 * sniff exists, taking `.ts` here would break video imports, which is the worse
 * failure. `.tsx`, `.mts` and `.cts` are unambiguous and are claimed.
 */
export const CODE_MIME_TYPES: Record<string, string> = {
  // Web
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  scss: 'text/plain',
  sass: 'text/plain',
  less: 'text/plain',
  vue: 'text/plain',
  svelte: 'text/plain',
  astro: 'text/plain',

  // JavaScript family
  js: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  jsx: 'text/javascript',
  tsx: 'text/plain',
  mts: 'text/plain',
  cts: 'text/plain',

  // Data and configuration
  json: 'application/json',
  jsonc: 'application/json',
  json5: 'application/json',
  xml: 'application/xml',
  yml: 'application/yaml',
  yaml: 'application/yaml',
  toml: 'text/plain',
  ini: 'text/plain',
  cfg: 'text/plain',
  conf: 'text/plain',
  env: 'text/plain',
  properties: 'text/plain',

  // Languages
  php: 'text/plain',
  py: 'text/plain',
  rb: 'text/plain',
  go: 'text/plain',
  rs: 'text/plain',
  java: 'text/plain',
  kt: 'text/plain',
  kts: 'text/plain',
  swift: 'text/plain',
  scala: 'text/plain',
  c: 'text/plain',
  h: 'text/plain',
  cpp: 'text/plain',
  cc: 'text/plain',
  cxx: 'text/plain',
  hpp: 'text/plain',
  cs: 'text/plain',
  m: 'text/plain',
  mm: 'text/plain',
  lua: 'text/plain',
  pl: 'text/plain',
  pm: 'text/plain',
  r: 'text/plain',
  dart: 'text/plain',
  ex: 'text/plain',
  exs: 'text/plain',
  erl: 'text/plain',
  hs: 'text/plain',
  clj: 'text/plain',
  cljs: 'text/plain',
  sql: 'text/plain',
  asm: 'text/plain',
  s: 'text/plain',

  // Shells
  sh: 'text/plain',
  bash: 'text/plain',
  zsh: 'text/plain',
  fish: 'text/plain',
  ps1: 'text/plain',
  bat: 'text/plain',
  cmd: 'text/plain',

  // Prose that is edited as source
  rst: 'text/plain',
  tex: 'text/plain',
  bib: 'text/plain',
  diff: 'text/plain',
  patch: 'text/plain',

  // Machine output
  log: 'text/plain',
};

/** Every extension that opens as source, without dots. */
export const CODE_EXTENSIONS = Object.keys(CODE_MIME_TYPES);

function normalise(extension?: string | null): string {
  return (extension ?? '').replace(/^\./, '').toLowerCase();
}

export function isCodeExtension(extension?: string | null): boolean {
  return normalise(extension) in CODE_MIME_TYPES;
}

/**
 * The code document type for one opened file, one instance per extension.
 *
 * A factory rather than a constant because the export extension and MIME follow
 * the file itself — saving a `.php` back as `.txt` would rename the user's file
 * out from under them. The `id` is shared by all of them, because the id is
 * what the sync server and Laravel key off and every code file is stored the
 * same way: as its own bytes.
 *
 * Cached because it is called during render and the result lands in dependency
 * arrays. Returning a fresh object each time made every render look like a
 * change: `useResourceText`'s effect re-ran, set state, and re-rendered, so
 * opening a `.log` or `.php` fetched the file in a loop that never settled.
 * The value describes the extension and nothing else, so one per extension is
 * all there ever needs to be.
 */
const instances = new Map<string, CodeDocumentType>();

export function codeDocumentTypeFor(
  extension?: string | null,
): CodeDocumentType {
  const fileExtension = normalise(extension);
  const cached = instances.get(fileExtension);

  if (cached) return cached;

  const documentType: CodeDocumentType = {
    surface: 'code',
    id: 'code',
    richExtension: 'rtxt',
    exportExtension: fileExtension || 'txt',
    mimeType: CODE_MIME_TYPES[fileExtension] ?? 'text/plain',
    label: 'Source file',
    fileExtension,
  };

  instances.set(fileExtension, documentType);

  return documentType;
}
