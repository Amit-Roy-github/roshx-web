/**
 * What the single window in the middle of the page is showing.
 *
 * The whole app is one window that changes what it holds — asking for a subject,
 * waiting for the model, or being typed into. Nothing ever navigates away.
 */
export enum PracticeWindowMode {
    TYPING = 'typing',
    COMPOSING = 'composing',
    GENERATING = 'generating',
}
