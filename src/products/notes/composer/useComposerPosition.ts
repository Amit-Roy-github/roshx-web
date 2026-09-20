import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const VIEWPORT_GAP = 12;
const KEYBOARD_MOVE_STEP = 24;
const DEFAULT_TOP_OFFSET = 28;
const DEFAULT_RIGHT_OFFSET = 250;
const COMPOSER_POSITION_STORAGE_KEY = 'roshx.notes.composer-position';

interface Position {
    left: number;
    top: number;
}

function readStoredPosition(): Position | null {
    try {
        const rawPosition = localStorage.getItem(COMPOSER_POSITION_STORAGE_KEY);
        if (!rawPosition) {
            return null;
        }
        const position = JSON.parse(rawPosition) as Partial<Position>;
        const { left, top } = position;
        return Number.isFinite(left) && Number.isFinite(top) && left !== undefined && top !== undefined
            ? { left, top }
            : null;
    } catch {
        // A malformed or unavailable local store should not prevent opening the composer.
        return null;
    }
}

export function useComposerPosition(isOpen: boolean) {
    const panelRef = useRef<HTMLElement>(null);
    const [position, setPosition] = useState<Position | null>(readStoredPosition);
    const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

    const clampPosition = (next: Position): Position => {
        const panel = panelRef.current;
        const maxLeft = Math.max(VIEWPORT_GAP, window.innerWidth - (panel?.offsetWidth ?? 0) - VIEWPORT_GAP);
        const maxTop = Math.max(VIEWPORT_GAP, window.innerHeight - (panel?.offsetHeight ?? 0) - VIEWPORT_GAP);
        return {
            left: Math.max(VIEWPORT_GAP, Math.min(next.left, maxLeft)),
            top: Math.max(VIEWPORT_GAP, Math.min(next.top, maxTop)),
        };
    };

    const setAndStorePosition = (nextPosition: Position) => {
        const clampedPosition = clampPosition(nextPosition);
        setPosition(clampedPosition);
        try {
            localStorage.setItem(COMPOSER_POSITION_STORAGE_KEY, JSON.stringify(clampedPosition));
        } catch {
            // Position persistence is a convenience; dragging must still work without it.
        }
    };

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }
        const fitToViewport = () => {
            const defaultPosition = {
                left: window.innerWidth - (panelRef.current?.offsetWidth ?? 0) - DEFAULT_RIGHT_OFFSET,
                top: DEFAULT_TOP_OFFSET,
            };
            setPosition((current) => clampPosition(current ?? defaultPosition));
        };
        fitToViewport();
        window.addEventListener('resize', fitToViewport);
        return () => window.removeEventListener('resize', fitToViewport);
    }, [isOpen]);

    const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || !panelRef.current) return;
        const bounds = panelRef.current.getBoundingClientRect();
        dragRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - bounds.left,
            offsetY: event.clientY - bounds.top,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        setAndStorePosition({ left: event.clientX - drag.offsetX, top: event.clientY - drag.offsetY });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        const directions: Record<string, [number, number]> = {
            ArrowLeft: [-KEYBOARD_MOVE_STEP, 0],
            ArrowRight: [KEYBOARD_MOVE_STEP, 0],
            ArrowUp: [0, -KEYBOARD_MOVE_STEP],
            ArrowDown: [0, KEYBOARD_MOVE_STEP],
        };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        if (position) {
            setAndStorePosition({ left: position.left + direction[0], top: position.top + direction[1] });
        }
    };

    return {
        panelRef,
        style: position ?? { top: DEFAULT_TOP_OFFSET, right: DEFAULT_RIGHT_OFFSET },
        dragHandleProps: {
            onPointerDown,
            onPointerMove,
            onKeyDown,
            onPointerUp: () => {
                dragRef.current = null;
            },
            onPointerCancel: () => {
                dragRef.current = null;
            },
            onLostPointerCapture: () => {
                dragRef.current = null;
            },
        },
    };
}
