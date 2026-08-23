import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { cn } from '@roshx/ui';
import { PassageFormat } from '@/products/practice/passage-format.enum';

/** Code is written against four columns; prose that happens to contain a tab is not. */
const TAB_SIZE_BY_FORMAT: Record<PassageFormat, number> = {
    [PassageFormat.CODE]: 4,
    [PassageFormat.PROSE]: 8,
    [PassageFormat.SECTIONED]: 8,
};

/** Which row of the window the line being typed is held at, counting from the top. */
const ACTIVE_LINE_ROW = 1;

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
    const paragraphRef = useRef<HTMLParagraphElement>(null);
    const [scrollOffsetPixels, setScrollOffsetPixels] = useState(0);

    // Which line the reader is on can only be answered by the DOM: the text wraps
    // on its own, so the same string is a different number of lines at a different
    // width. offsetTop is the layout position and is unaffected by the transform
    // below, so measuring it here cannot feed back into itself.
    useLayoutEffect(() => {
        const paragraph = paragraphRef.current;
        const activeCharacter = activeCharacterRef.current;
        if (!paragraph || !activeCharacter) return;

        const lineHeight = Number.parseFloat(getComputedStyle(paragraph).lineHeight);
        const activeLineIndex = Math.round(activeCharacter.offsetTop / lineHeight);
        setScrollOffsetPixels(Math.max(0, activeLineIndex - ACTIVE_LINE_ROW) * lineHeight);
    }, [content, typedText, activeCharacterRef]);

    return (
        // The passage slides up under the window the card already clips, so the
        // line being typed stays on the same row instead of the reader's eye
        // walking down the page.
        <p
            ref={paragraphRef}
            className="relative font-mono text-[1.05rem] leading-9 whitespace-pre-wrap text-pending transition-transform duration-150 ease-out sm:text-[1.15rem]"
            style={{
                tabSize: TAB_SIZE_BY_FORMAT[format],
                transform: `translateY(-${scrollOffsetPixels}px)`,
            }}
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
                // Every character carries the border, transparent until it is the
                // one being typed — a border that appears would shift the line.
                'border-b-2 border-transparent',
                !isUntyped && (isCorrect ? 'text-foreground' : 'text-destructive'),
                isMistypedSpace && 'rounded-[2px] bg-mistyped',
                isNext && 'border-primary',
            )}
        >
            {character}
        </span>
    );
}
