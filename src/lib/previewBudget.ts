/**
 * How much of a file a preview renders.
 *
 * A preview is a glance, and the two surfaces pay for text very differently.
 * The rich surface (Tiptap) builds a DOM node for every paragraph, so a 1 MB
 * notebook rendered as prose froze the whole app; CodeMirror draws only the
 * lines in view and takes a large file in its stride. Past the budget the
 * preview shows the head of the file and says so, which is more useful than
 * a glyph and costs the same whatever the file's size.
 */
export const PREVIEW_PROSE_BYTES = 100_000;
export const PREVIEW_CODE_BYTES = 1_000_000;

export function previewBudgetFor(surface: 'rich' | 'code'): number {
  return surface === 'code' ? PREVIEW_CODE_BYTES : PREVIEW_PROSE_BYTES;
}

export interface PreviewText {
  text: string;
  /** Bytes `text` amounts to. */
  shownBytes: number;
  /** Bytes the file holds in all. */
  totalBytes: number;
  /** Whether `text` is only the head of the file. */
  truncated: boolean;
}

/**
 * The text a preview renders: the whole file when it fits the budget, else
 * its head. Only the head is decoded, so a file far past the budget costs
 * no more than one at it.
 */
export async function readPreviewText(
  blob: Blob,
  budget: number,
): Promise<PreviewText> {
  if (blob.size <= budget) {
    const text = await blob.text();

    return {
      text,
      shownBytes: blob.size,
      totalBytes: blob.size,
      truncated: false,
    };
  }

  const text = headOnLineBoundary(await blob.slice(0, budget).text());

  return {
    text,
    shownBytes: new Blob([text]).size,
    totalBytes: blob.size,
    truncated: true,
  };
}

/**
 * Where to cut the head of a file: on the last line break, so no half-line
 * shows at the bottom, unless that would throw away most of the head (one
 * long line after a short header). A byte slice can also split a multi-byte
 * character, which decodes as U+FFFD; a cut on a line break drops it with
 * the line, the other cut drops it by hand.
 */
export function headOnLineBoundary(head: string): string {
  const lastNewline = head.lastIndexOf('\n');

  if (lastNewline === -1 || lastNewline < head.length / 2) {
    return head.replace(/�$/, '');
  }

  return head.slice(0, lastNewline);
}
