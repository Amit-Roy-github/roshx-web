/** Mac keyboards say Cmd, everyone else says Ctrl. Only ever shown to a reader. */
export const MODIFIER_KEY_LABEL = /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl';

/**
 * Whether the reader is typing into something.
 *
 * Page-wide shortcuts have to stand aside when they are: '/' means "focus the
 * title" on the page and means a slash inside a note.
 */
export function isEditableElementFocused(): boolean {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
        return false;
    }
    return (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );
}

export function isModifierKeyPressed(event: KeyboardEvent): boolean {
    return event.metaKey || event.ctrlKey;
}
