import { describe, expect, it } from 'vitest';
import {
  CODE_EXTENSIONS,
  codeDocumentTypeFor,
  documentTypeFor,
  isCodeExtension,
} from '../src/document-types';
import {
  MAX_CODE_BYTES,
  detectLineEnding,
  inspectCodeFile,
  looksBinary,
} from '../src/lib/codeFile';

describe('choosing a surface', () => {
  it.each(['md', 'markdown', 'mdown', 'mkd'])(
    'renders .%s as markdown',
    ext => {
      expect(documentTypeFor(ext).id).toBe('markdown');
    },
  );

  it('renders .txt as a rich text document', () => {
    const documentType = documentTypeFor('txt');

    expect(documentType.id).toBe('text');
    expect(documentType.surface).toBe('rich');
  });

  it.each([
    'php',
    'js',
    'json',
    'log',
    'c',
    'h',
    'py',
    'go',
    'rs',
    'sh',
    'yml',
    'sql',
    'html',
    'css',
    'env',
  ])('renders .%s as source', ext => {
    const documentType = documentTypeFor(ext);

    expect(documentType.surface).toBe('code');
    expect(documentType.id).toBe('code');
  });

  it('is case-insensitive and tolerates a leading dot', () => {
    expect(documentTypeFor('.PHP').surface).toBe('code');
    expect(documentTypeFor('JSON').surface).toBe('code');
  });

  it('falls back to text when the host gave us no extension', () => {
    expect(documentTypeFor(undefined).id).toBe('text');
    expect(documentTypeFor(null).id).toBe('text');
    expect(documentTypeFor('').id).toBe('text');
  });

  /**
   * `.ts` is an MPEG transport stream as far as this app is concerned — the
   * video editor claims it — and the two cannot be told apart by name. Claiming
   * it here would break video imports to fix a typo-sized annoyance.
   */
  it('leaves .ts to the video editor', () => {
    expect(isCodeExtension('ts')).toBe(false);
    expect(CODE_EXTENSIONS).not.toContain('ts');
    expect(CODE_EXTENSIONS).toContain('tsx');
  });
});

describe('a code document type', () => {
  it('keeps the file its own extension and MIME', () => {
    const documentType = codeDocumentTypeFor('php');

    expect(documentType.exportExtension).toBe('php');
    expect(documentType.mimeType).toBe('text/plain');
    expect(documentType.fileExtension).toBe('php');
  });

  it.each([
    ['json', 'application/json'],
    ['html', 'text/html'],
    ['css', 'text/css'],
    ['js', 'text/javascript'],
    ['yaml', 'application/yaml'],
    ['xml', 'application/xml'],
  ])('gives .%s the %s MIME type', (extension, mimeType) => {
    expect(codeDocumentTypeFor(extension).mimeType).toBe(mimeType);
  });

  it('shares one id across every language, because storage is identical', () => {
    expect(codeDocumentTypeFor('php').id).toBe(codeDocumentTypeFor('rs').id);
  });

  /**
   * This is resolved during render and lands in dependency arrays. When it
   * returned a fresh object each call, every render looked like a change to
   * the effect that reads the file: it re-ran, set state, re-rendered, and
   * opening a `.log` or `.php` fetched in a loop that never settled.
   */
  it('returns the same instance for the same extension', () => {
    expect(codeDocumentTypeFor('php')).toBe(codeDocumentTypeFor('php'));
    expect(documentTypeFor('log')).toBe(documentTypeFor('log'));
    expect(documentTypeFor('.LOG')).toBe(documentTypeFor('log'));
  });

  it('still gives different extensions different instances', () => {
    expect(codeDocumentTypeFor('php')).not.toBe(codeDocumentTypeFor('py'));
  });
});

describe('line endings', () => {
  it('reads a LF file as LF', () => {
    expect(detectLineEnding('one\ntwo\nthree')).toBe('\n');
  });

  it('reads a CRLF file as CRLF', () => {
    expect(detectLineEnding('one\r\ntwo\r\nthree')).toBe('\r\n');
  });

  it('treats a mixed file as LF, the less destructive reading', () => {
    expect(detectLineEnding('one\r\ntwo\nthree')).toBe('\n');
  });

  it('treats a file with no break at all as LF', () => {
    expect(detectLineEnding('single line')).toBe('\n');
  });
});

describe('refusing what cannot be shown', () => {
  it('accepts ordinary source', () => {
    expect(inspectCodeFile('const x = 1;\n')).toBeNull();
  });

  it('accepts an empty file', () => {
    expect(inspectCodeFile('')).toBeNull();
  });

  it('refuses a file holding a NUL', () => {
    expect(looksBinary('MZ\u0000\u0000text')).toBe(true);
    expect(inspectCodeFile('MZ\u0000\u0000text')).toBe('binary');
  });

  it('refuses a file that failed to decode as text', () => {
    expect(inspectCodeFile('\uFFFD'.repeat(50) + 'x'.repeat(100))).toBe(
      'binary',
    );
  });

  it('allows the occasional replacement character in real text', () => {
    const mostlyText = 'a'.repeat(1000) + '\uFFFD';

    expect(looksBinary(mostlyText)).toBe(false);
  });

  it('refuses a file past the size cap', () => {
    expect(inspectCodeFile('x'.repeat(MAX_CODE_BYTES + 1))).toBe('too-large');
  });

  it('measures the cap in bytes, not characters', () => {
    // Four bytes each in UTF-8, so a quarter of the cap in characters is
    // already the whole cap in bytes — far below the cap if you count the
    // string's length instead.
    const emoji = '😀'.repeat(MAX_CODE_BYTES / 4 + 1);

    expect(emoji.length).toBeLessThan(MAX_CODE_BYTES);

    expect(inspectCodeFile(emoji)).toBe('too-large');
  });
});
