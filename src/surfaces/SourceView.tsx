import { useT } from '@returfs/shared-external-react';

/**
 * The markdown behind the document.
 *
 * A WYSIWYG editor can only hold what its schema can name, and markdown holds
 * more than that — front matter, footnote markers, raw HTML, a link reference
 * you keep at the bottom of the file. Those survive a round trip as literal
 * text, but they are only *editable* here. This is also the honest answer to
 * "what exactly is going to be written to my file".
 */
export function SourceView({
  value,
  readOnly,
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (next: string) => void;
}) {
  const t = useT('ext:text-editor');

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <p className="shrink-0 px-6 pt-3 pb-2 text-xs text-neutral-500 dark:text-neutral-400">
        {readOnly ? t('mode.sourceHint') : t('mode.sourceEditHint')}
      </p>
      <textarea
        className="min-h-0 w-full flex-1 resize-none bg-transparent px-6 pb-6 font-mono text-sm leading-relaxed text-neutral-800 outline-none dark:text-neutral-200"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        readOnly={readOnly}
        value={value}
        onChange={event => onChange?.(event.target.value)}
      />
    </div>
  );
}
