import type { RefObject } from 'react';
import { PassageFormat } from '@/products/practice/passage-format.enum';

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
            className="font-mono text-[1.05rem] leading-9 whitespace-pre-wrap sm:text-[1.15rem]"
            style={{ color: 'var(--text-pending)', tabSize: format === PassageFormat.CODE ? 4 : 8 }}
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
            style={{
                color: isUntyped ? undefined : isCorrect ? 'var(--text-primary)' : 'var(--error-text)',
                backgroundColor: isMistypedSpace ? 'var(--error-surface)' : undefined,
                borderRadius: isMistypedSpace ? '2px' : undefined,
                borderBottom: isNext ? '2px solid var(--accent)' : '2px solid transparent',
                animation: isNext ? 'caret-blink 1.1s ease-in-out infinite' : undefined,
            }}
        >
            {character}
        </span>
    );
}
