/** English catalogue for the ext:text-editor namespace. */
export default {
  app: {
    title: 'Text Editor',
  },
  mode: {
    view: 'View',
    edit: 'Edit',
    done: 'Done',
    rendered: 'Rendered',
    source: 'Source',
    sourceHint: 'The markdown behind this document.',
    sourceEditHint:
      'Edit the markdown directly. Your changes apply when you switch back.',
  },
  viewer: {
    loading: 'Opening…',
    empty: 'This file is empty.',
    failed: 'This file could not be opened.',
    retry: 'Try again',
    encryptedNeedsApp: 'This encrypted document needs the app to open it.',
    tooLarge:
      'This file is too big to open here. Files up to 5 MB open in the editor.',
    notText: 'This file isn’t text, so it can’t be opened in the editor.',
  },
  preview: {
    truncated: 'Showing the first {{shown}} of {{total}}.',
  },
  editor: {
    loading: 'Loading…',
    retry: 'Retry',
    connectFailed: 'Couldn’t connect to the collaboration server.',
    encryptedFailed: 'Couldn’t open this encrypted document.',
    encryptedLabel: 'encrypted',
    connectionError: 'Connection error',
    saveFailed: 'Save failed',
    othersOnline_one: '1 other online',
    othersOnline_other: '{{count}} others online',
  },
  reconcile: {
    title: 'This file changed outside the editor',
    body: 'The file was edited somewhere else since you last saved here. Keep your version (replacing the external changes), or reload the external changes (your formatting for this document will be lost).',
    reload: 'Reload external changes',
    keepMine: 'Keep my version',
  },
};
