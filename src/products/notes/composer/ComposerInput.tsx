import { useLayoutEffect, type RefObject } from 'react';
import { Button, Textarea, Tooltip, TooltipContent, TooltipTrigger } from '@roshx/ui';
import { ArrowUpIcon, SquareIcon } from 'lucide-react';
import { COMPOSER_MESSAGE_MAX_LENGTH } from './composerApi';

const INPUT_MAX_HEIGHT = 120;

interface ComposerInputProps {
    inputRef: RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop: () => void;
    isPending: boolean;
    disabled: boolean;
}

export function ComposerInput({
    inputRef,
    value,
    onChange,
    onSend,
    onStop,
    isPending,
    disabled,
}: ComposerInputProps) {
    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, INPUT_MAX_HEIGHT)}px`;
    }, [inputRef, value]);

    const actionLabel = isPending ? 'Stop generating' : 'Send message';

    return (
        <div className="flex items-center gap-1 rounded-2xl border border-notes-line-strong bg-notes-line-faint p-0.5 pl-2 transition-[border-color,box-shadow]">
            <Textarea
                ref={inputRef}
                aria-label="Message AI composer"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Ask for a change…"
                rows={1}
                maxLength={COMPOSER_MESSAGE_MAX_LENGTH}
                disabled={disabled || isPending}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        if (!disabled && !isPending) onSend();
                    }
                }}
                className="min-h-7 min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent p-1 text-xs leading-4 text-notes-ink shadow-none [field-sizing:fixed] placeholder:text-xs placeholder:text-notes-ink-faint focus-visible:ring-0 dark:bg-transparent"
            />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type={isPending ? 'button' : 'submit'}
                        size="icon-xs"
                        onClick={isPending ? onStop : undefined}
                        aria-label={actionLabel}
                        disabled={!isPending && (disabled || !value.trim())}
                        className="rounded-full bg-notes-accent-strong text-white shadow-sm hover:bg-notes-accent focus-visible:ring-notes-accent/30 disabled:bg-notes-line-strong disabled:text-notes-ink-faint disabled:opacity-100 disabled:shadow-none"
                    >
                        {isPending ? (
                            <SquareIcon aria-hidden="true" className="size-3 fill-current" />
                        ) : (
                            <ArrowUpIcon aria-hidden="true" className="size-3.5" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                    {isPending ? actionLabel : 'Send · Enter'}
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
