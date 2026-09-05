import { describe, expect, it } from 'vitest';
import {
  PREVIEW_CODE_BYTES,
  PREVIEW_PROSE_BYTES,
  headOnLineBoundary,
  previewBudgetFor,
  readPreviewText,
} from '../src/lib/previewBudget';

describe('previewBudgetFor', () => {
  it('gives prose a far smaller budget than code', () => {
    expect(previewBudgetFor('rich')).toBe(PREVIEW_PROSE_BYTES);
    expect(previewBudgetFor('code')).toBe(PREVIEW_CODE_BYTES);
    expect(PREVIEW_PROSE_BYTES).toBeLessThan(PREVIEW_CODE_BYTES);
  });
});

describe('readPreviewText', () => {
  it('renders a file within the budget whole', async () => {
    const result = await readPreviewText(new Blob(['one\ntwo\n']), 100);

    expect(result).toEqual({
      text: 'one\ntwo\n',
      shownBytes: 8,
      totalBytes: 8,
      truncated: false,
    });
  });

  it('renders only the head of a file past the budget, cut on a line', async () => {
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    const blob = new Blob([lines]);

    const result = await readPreviewText(blob, 200);

    expect(result.truncated).toBe(true);
    expect(result.totalBytes).toBe(blob.size);
    expect(result.shownBytes).toBe(result.text.length);
    expect(result.shownBytes).toBeLessThanOrEqual(200);
    expect(result.text.endsWith('\n')).toBe(false);
    expect(lines.startsWith(`${result.text}\n`)).toBe(true);
  });

  it('drops a character torn in half by the byte cut', async () => {
    // Each of these is 3 bytes; a 7-byte head splits the third one.
    const result = await readPreviewText(new Blob(['€€€€']), 7);

    expect(result.text).toBe('€€');
    expect(result.shownBytes).toBe(6);
    expect(result.truncated).toBe(true);
  });
});

describe('headOnLineBoundary', () => {
  it('keeps a head with no line break, minus a torn character', () => {
    expect(headOnLineBoundary('abc�')).toBe('abc');
    expect(headOnLineBoundary('abc')).toBe('abc');
  });

  it('keeps the long last line when cutting at the break would lose most of the head', () => {
    const head = `header\n${'x'.repeat(100)}`;

    expect(headOnLineBoundary(head)).toBe(head);
  });
});
