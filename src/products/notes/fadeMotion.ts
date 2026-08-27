import type { MotionProps } from 'motion/react';

/**
 * The fade-and-slide the notes app has always used.
 *
 * The original expressed this as a Svelte action for the entrance and a
 * transition for the exit; in React both live on the element, so one object
 * carries all three states. Same library, same distances, same durations.
 */
export const FADE_SLIDE_MOTION: MotionProps = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};
