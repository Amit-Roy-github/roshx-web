import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Separator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, cn } from '@roshx/ui';
import { GripVerticalIcon, SparklesIcon, SquarePenIcon, XIcon } from 'lucide-react';
import { COMPOSER_MAX_MESSAGES } from './composerApi';
import { ComposerInput } from './ComposerInput';
import { useNoteComposer } from './useNoteComposer';
import { useComposerPosition } from './useComposerPosition';

const TOOLTIP_DELAY_MS = 300;
const headerButtonClass =
    'text-notes-ink-muted hover:bg-notes-line hover:text-notes-ink focus-visible:ring-notes-accent/30';

export function NoteComposer({ disabled = false }: { disabled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const composer = useNoteComposer();
    const { panelRef, style, dragHandleProps } = useComposerPosition(isOpen);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const dialogId = useId();
    const titleId = useId();
    const isPending = composer.pendingMessage !== null;
    const isConversationFull = composer.messages.length >= COMPOSER_MAX_MESSAGES;
    const displayedMessages = composer.pendingMessage
        ? [...composer.messages, composer.pendingMessage]
        : composer.messages;

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        const list = messagesRef.current;
        if (list) list.scrollTop = list.scrollHeight;
    }, [isOpen, composer.messages, composer.pendingMessage, composer.error]);

    const close = () => {
        composer.cancel();
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    return (
        <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>
            <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                aria-expanded={isOpen}
                aria-controls={isOpen ? dialogId : undefined}
                aria-haspopup="dialog"
                onClick={() => (isOpen ? close() : setIsOpen(true))}
                className="gap-1.5 rounded-lg border-notes-accent-strong/30 text-notes-accent shadow-none hover:bg-notes-accent-strong/10 hover:text-notes-accent focus-visible:ring-notes-accent/30"
            >
                <SparklesIcon aria-hidden="true" className="size-4" />
                RoshxAI
            </Button>
            {isOpen &&
                createPortal(
                    <section
                        ref={panelRef}
                        id={dialogId}
                        role="dialog"
                        aria-labelledby={titleId}
                        style={style}
                        className="fixed z-50 flex h-[17.5rem] max-h-[calc(100dvh-1.5rem)] w-[30rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-notes-line-strong bg-notes-surface text-notes-ink shadow-2xl"
                        onKeyDown={(event) => {
                            // This portal still belongs to the note form in React. Chat
                            // shortcuts must not reach the page's save/delete handlers.
                            event.stopPropagation();
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                close();
                            }
                        }}
                    >
                        <header className="flex shrink-0 items-center gap-1 bg-notes-line-faint/60 px-1 py-1">
                            <Button
                                {...dragHandleProps}
                                type="button"
                                variant="ghost"
                                aria-label="Move AI composer"
                                title="Drag to move, or focus and use arrow keys"
                                className="h-7 min-w-0 flex-1 touch-none cursor-grab justify-start gap-2 px-0 text-notes-ink select-none hover:bg-transparent hover:text-notes-ink focus-visible:ring-notes-accent/30 active:cursor-grabbing"
                            >
                                <GripVerticalIcon
                                    aria-hidden="true"
                                    className="size-4 text-notes-ink-faint"
                                />
                                <span id={titleId} className="text-sm font-semibold leading-none">
                                    RoshxAI
                                </span>
                            </Button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => {
                                            composer.reset();
                                            inputRef.current?.focus();
                                        }}
                                        disabled={
                                            isPending ||
                                            (composer.messages.length === 0 &&
                                                !composer.draft &&
                                                !composer.error)
                                        }
                                        aria-label="New chat"
                                        className={headerButtonClass}
                                    >
                                        <SquarePenIcon aria-hidden="true" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" sideOffset={8}>
                                    New chat
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={close}
                                        aria-label="Close AI composer"
                                        className={headerButtonClass}
                                    >
                                        <XIcon aria-hidden="true" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" sideOffset={8}>
                                    Close · Esc
                                </TooltipContent>
                            </Tooltip>
                        </header>
                        <Separator className="bg-notes-line" />
                        <div
                            ref={messagesRef}
                            role="log"
                            aria-label="Composer conversation"
                            aria-live="polite"
                            aria-relevant="additions text"
                            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-none p-4"
                        >
                            {displayedMessages.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-notes-accent-strong/15 text-notes-accent ring-1 ring-notes-accent-strong/20">
                                        <SparklesIcon aria-hidden="true" className="size-4" />
                                    </div>
                                    <p className="text-sm font-medium text-notes-ink">Start with your note</p>
                                    <p className="mt-1 text-xs leading-relaxed text-notes-ink-muted">
                                        Ask RoshxAI to draft, rewrite, or improve the title and content.
                                    </p>
                                </div>
                            )}
                            {displayedMessages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'flex flex-col gap-1',
                                        message.role === 'user' ? 'items-end' : 'items-start',
                                    )}
                                >
                                    <p
                                        className={cn(
                                            'text-sm leading-relaxed whitespace-pre-wrap break-words',
                                            message.role === 'user'
                                                ? 'max-w-[92%] rounded-lg bg-notes-accent-strong/10 px-3 py-2'
                                                : 'w-full',
                                        )}
                                    >
                                        {message.parts.map((part) => part.text).join('\n')}
                                    </p>
                                </div>
                            ))}
                            {isPending && (
                                <p role="status" className="text-xs text-notes-ink-muted">
                                    Thinking…
                                </p>
                            )}
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!disabled) void composer.send();
                            }}
                            className="shrink-0 border-t border-notes-line-faint bg-notes-surface px-2 pb-1 pt-0"
                        >
                            {composer.error && (
                                <p role="alert" className="mb-2 text-xs text-notes-danger">
                                    {composer.error}
                                </p>
                            )}
                            {isConversationFull && (
                                <p className="mb-2 text-xs text-notes-ink-muted">
                                    Start a new chat to continue with the current note.
                                </p>
                            )}
                            <ComposerInput
                                inputRef={inputRef}
                                value={composer.draft}
                                onChange={composer.setDraft}
                                onSend={() => void composer.send()}
                                onStop={composer.cancel}
                                isPending={isPending}
                                disabled={disabled || isConversationFull}
                            />
                        </form>
                    </section>,
                    document.body,
                )}
        </TooltipProvider>
    );
}
