import type { RefObject } from 'react';
import { cn } from '@roshx/ui';
import { PassageFormat } from '@/products/practice/passage-format.enum';

/** Code is written against four columns; prose that happens to contain a tab is not. */
const TAB_SIZE_BY_FORMAT: Record<PassageFormat, number> = {
    [PassageFormat.CODE]: 4,
    [PassageFormat.PROSE]: 8,
    [PassageFormat.SECTIONED]: 8,
};

interface PassageTextProps {
    content: string;
    typedText: string;
    format: PassageFormat;
    /** Points at the character the reader is about to type, so it can be kept in view. */
    activeCharacterRef: RefObject<HTMLSpanElement | null>;
}

/**
 * The passage, one character at a time, coloured by what the reader has done
 * with it: typed correctly, typed wrongly, or not yet reached.
 *
 * Rendering per character rather than per word is what lets a wrong keystroke
 * show up exactly where it happened, and what keeps code passages honest about
 * their spaces.
 */
export function PassageText({ content, typedText, format, activeCharacterRef }: PassageTextProps) {
    return (
        <p
            className="font-mono text-[1.05rem] leading-9 whitespace-pre-wrap text-pending sm:text-[1.15rem]"
            style={{ tabSize: TAB_SIZE_BY_FORMAT[format] }}
        >
            {[...content].map((character, index) => (
                <PassageCharacter
                    key={index}
                    character={character}
                    typedCharacter={typedText[index]}
                    isNext={index === typedText.length}
                    activeCharacterRef={activeCharacterRef}
                />
            ))}
        </p>
    );
}

interface PassageCharacterProps {
    character: string;
    typedCharacter: string | undefined;
    isNext: boolean;
    activeCharacterRef: RefObject<HTMLSpanElement | null>;
}

function PassageCharacter({ character, typedCharacter, isNext, activeCharacterRef }: PassageCharacterProps) {
    const isUntyped = typedCharacter === undefined;
    const isCorrect = typedCharacter === character;
    // A wrong space has nothing to colour, so it gets a block of colour instead.
    const isMistypedSpace = !isUntyped && !isCorrect && character === ' ';

    return (
        <span
            ref={isNext ? activeCharacterRef : undefined}
            className={cn(
                // Always a bottom border, transparent when this is not the caret:
                // giving it one only when active would shift every line by 2px
                // as the reader moves through it.
                'border-b-2 border-transparent',
                !isUntyped && (isCorrect ? 'text-foreground' : 'text-destructive'),
                isMistypedSpace && 'rounded-[2px] bg-mistyped',
                isNext && 'animate-caret-blink border-primary',
            )}
        >
            {character}
        </span>
    );
}
