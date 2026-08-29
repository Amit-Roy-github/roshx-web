import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@roshx/ui';
import { FADE_SLIDE_MOTION } from '@/products/notes/fadeMotion';

const PLACEHOLDER = 'Tell AI what to change in this note…';

interface AiEditBoxProps {
    isOpen: boolean;
    isBusy: boolean;
    errorMessage: string | null;
    onSubmit: (instruction: string) => Promise<void>;
    onClose: () => void;
}

/**
 * A small floating box, not a modal: no backdrop, the note stays clickable
 * and editable behind it, and it can be dragged anywhere on the page by its
 * top strip. One textarea, nothing else — the instruction is the whole UI.
 */
export function AiEditBox({ isOpen, isBusy, errorMessage, onSubmit, onClose }: AiEditBoxProps) {
    const [instruction, setInstruction] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            textareaRef.current?.focus();
        }
    }, [isOpen]);

    const submit = async () => {
        const trimmedInstruction = instruction.trim();
        if (!trimmedInstruction || isBusy) {
            return;
        }
        await onSubmit(trimmedInstruction);
        setInstruction('');
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Escape') {
            onClose();
            return;
        }
        // Enter sends; Shift+Enter is the newline, same as any chat box.
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void submit();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    {...FADE_SLIDE_MOTION}
                    drag
                    dragMomentum={false}
                    role="dialog"
                    aria-label="Edit note with AI"
                    className="fixed right-6 bottom-24 z-40 w-80 rounded-lg border border-notes-line bg-notes-surface shadow-xl"
                >
                    <div className="flex cursor-grab items-center justify-between rounded-t-lg border-b border-notes-line-faint px-3 py-1.5 active:cursor-grabbing">
                        <span className="text-[11px] font-medium tracking-wide text-notes-ink-faint uppercase">
                            AI
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded px-1 text-notes-ink-faint transition-colors hover:text-notes-ink"
                        >
                            ×
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={instruction}
                        onChange={(event) => setInstruction(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onPointerDown={(event) => event.stopPropagation()}
                        placeholder={PLACEHOLDER}
                        rows={3}
                        disabled={isBusy}
                        className={cn(
                            'w-full resize-none bg-transparent px-3 py-2 text-sm text-notes-ink placeholder-notes-ink-faint outline-none',
                            isBusy && 'animate-pulse',
                        )}
                    />
                    {errorMessage && <p className="px-3 pb-2 text-xs text-notes-danger">{errorMessage}</p>}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
