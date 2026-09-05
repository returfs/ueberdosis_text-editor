/**
 * What a source file needs checking for before it is put in front of someone,
 * and what has to be preserved about it that is not its characters.
 */

/**
 * Files past this size are not opened in the browser.
 *
 * CodeMirror only renders the visible viewport, so it survives a large file
 * better than a rich-text editor would — but the bytes still have to cross the
 * network, sit in a Yjs document and be diffed on every keystroke. A 5 MB log
 * is already a slow open; a 500 MB one would hang the tab.
 */
export const MAX_CODE_BYTES = 5_000_000;

export type LineEnding = '\n' | '\r\n';

/**
 * Which line ending the file uses.
 *
 * This is not cosmetic. If a CRLF file is edited as if it were LF, every line
 * either keeps a stray carriage return the editor draws as a control picture,
 * or the file is rewritten wholesale on the first save — a one-character change
 * arriving as a diff that touches every line. CodeMirror can be told the
 * separator instead, so the file keeps whatever it came with.
 *
 * A file mixing both is treated as LF: forcing CRLF on it would fold its lone
 * newlines into the middle of lines, which is the more destructive reading.
 */
export function detectLineEnding(text: string): LineEnding {
  const newlines = (text.match(/\n/g) ?? []).length;
  if (newlines === 0) return '\n';

  const carriageReturns = (text.match(/\r\n/g) ?? []).length;

  return carriageReturns === newlines ? '\r\n' : '\n';
}

/**
 * Whether these bytes are not text at all.
 *
 * The resource endpoint hands back a decoded string, so a binary file arrives
 * as mojibake rather than as an error. A NUL is the standard tell (it cannot
 * appear in text), and a thick run of replacement characters means the decode
 * already failed. Either way, showing the result would be worse than saying we
 * cannot open it.
 */
export function looksBinary(text: string): boolean {
  const sample = text.slice(0, 8192);
  if (sample.includes('\u0000')) return true;

  const replacements = (sample.match(/\uFFFD/g) ?? []).length;

  return sample.length > 0 && replacements / sample.length > 0.05;
}

export type CodeFileProblem = 'too-large' | 'binary';

/** The reason this file cannot be opened as source, if there is one. */
export function inspectCodeFile(text: string): CodeFileProblem | null {
  // Bytes, not characters: a file of astral-plane characters is longer than
  // its `.length` suggests.
  if (new Blob([text]).size > MAX_CODE_BYTES) return 'too-large';
  if (looksBinary(text)) return 'binary';

  return null;
}
