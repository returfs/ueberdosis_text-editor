/**
 * Does markdown survive the editor's REAL schema?
 *
 * The conversion package is schema-free by design, so its node names are
 * matched against ExtensionKit by string. A name that does not exist in the
 * schema is not an error anywhere — ProseMirror just drops the node, and the
 * file quietly loses a table or a quote on the first save. This builds the
 * actual schema the editor uses and puts a document through it.
 */
import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { docToMarkdown, markdownToDoc } from '@returfs/markdown-doc';
import ExtensionKit from '../src/extensions/extension-kit';

const schema = getSchema(ExtensionKit());

/** Parse, put through the real schema, and serialise — exactly as a save does. */
function throughSchema(source: string): string {
  const doc = PMNode.fromJSON(schema, markdownToDoc(source) as never);

  return docToMarkdown(doc.toJSON());
}

const SOURCE = `---
title: Release notes
tags: [a, b]
---

# Release notes

Some **bold**, *italic*, ~~struck~~ and \`code\`, plus a [link](https://example.com "Docs").

## Lists

- one
- two
  - nested deeper
- three

1. first
2. second

- [ ] not done
- [x] done

## Quote

> A quoted line with **bold** in it.
>
> - and a list inside the quote

## Table

| Left | Middle | Right |
| :--- | :---: | ---: |
| a | b | c |

## Code

\`\`\`ts
const x: number = 1;
\`\`\`

## Media

![a picture](https://example.com/a.png)

***

Raw <span class="x">html</span> stays literal, and a footnote marker [^1] too.
`;

describe('markdown through the editor schema', () => {
  const out = throughSchema(SOURCE);

  it.each([
    ['front matter stays fenced with ---', '---\ntitle: Release notes'],
    ['heading', '# Release notes'],
    ['bold', '**bold**'],
    ['italic', '*italic*'],
    ['strikethrough', '~~struck~~'],
    ['inline code', '`code`'],
    ['link with a title', '[link](https://example.com "Docs")'],
    ['nested bullet', '  - nested deeper'],
    ['ordered list', '1. first'],
    ['unchecked task', '- [ ] not done'],
    ['checked task', '- [x] done'],
    ['blockquote keeping its bold', '> A quoted line with **bold** in it.'],
    ['a list inside a blockquote', '> - and a list inside the quote'],
    ['table column alignment', '| :--- | :---: | ---: |'],
    ['fenced code with its language', '```ts'],
    ['image', '![a picture](https://example.com/a.png)'],
    ['raw html left literal', '<span class="x">html</span>'],
    ['footnote marker left literal', '[^1]'],
  ])('keeps %s', (_name, expected) => {
    expect(out).toContain(expected);
  });

  it('keeps a thematic break', () => {
    expect(out).toMatch(/\n(---|\*\*\*)\n/);
  });

  /**
   * The conversion package matches node names against this schema by string,
   * because it has to run on a server that cannot build one. A name that does
   * not exist here is not an error anywhere — ProseMirror drops the node and
   * the file quietly loses a table or a quote. So assert the whole set.
   */
  it('produces only nodes and marks the editor actually has', () => {
    const doc = PMNode.fromJSON(schema, markdownToDoc(SOURCE) as never);
    const seen = new Set<string>();

    doc.descendants(node => {
      seen.add(node.type.name);
      node.marks.forEach(mark => seen.add(`mark:${mark.type.name}`));
    });

    expect([...seen].sort()).toEqual([
      'blockquoteFigure',
      'bulletList',
      'codeBlock',
      'heading',
      'horizontalRule',
      'imageBlock',
      'listItem',
      'mark:bold',
      'mark:code',
      'mark:italic',
      'mark:link',
      'mark:strike',
      'orderedList',
      'paragraph',
      'quote',
      'quoteCaption',
      'table',
      'tableCell',
      'tableHeader',
      'tableRow',
      'taskItem',
      'taskList',
      'text',
    ]);
  });

  it('does not keep changing the file on later saves', () => {
    expect(throughSchema(out)).toBe(out);
  });
});
