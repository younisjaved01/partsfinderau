import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * TypewriterText — a lightweight, self-contained typewriter built on React
 * state + timers, with `motion/react` driving only the cursor (and reduced-
 * motion detection). No animation library beyond the already-installed free
 * `motion` package; no Motion+ / motion-plus / framer-motion.
 *
 * It types a phrase, pauses, deletes it, then advances to the next — looping.
 * Purely decorative (aria-hidden): pair it with a real, accessible input.
 *
 * Reduced motion: shows a single static phrase (no typing/deleting/blink) so
 * the experience stays calm and fully usable.
 */
export interface TypewriterTextProps {
  phrases: string[];
  /** ms per character while typing. */
  typingSpeed?: number;
  /** ms per character while deleting. */
  deletingSpeed?: number;
  /** ms to hold a completed phrase before deleting. */
  pauseMs?: number;
  /** ms before the first keystroke. */
  startDelay?: number;
  /** loop through the phrases forever (default true). */
  loop?: boolean;
  className?: string;
  cursorClassName?: string;
}

export function TypewriterText({
  phrases,
  typingSpeed = 45,
  deletingSpeed = 26,
  pauseMs = 1500,
  startDelay = 250,
  loop = true,
  className = '',
  cursorClassName = '',
}: TypewriterTextProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState('');
  const key = phrases.join('|');

  useEffect(() => {
    // Reduced motion → one static phrase, no timers.
    if (reduce) {
      setDisplay(phrases[0] ?? '');
      return;
    }
    let phraseIndex = 0;
    let charCount = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = phrases[phraseIndex % phrases.length] ?? '';
      if (!deleting) {
        charCount += 1;
        setDisplay(phrase.slice(0, charCount));
        if (charCount >= phrase.length) {
          if (!loop && phraseIndex === phrases.length - 1) return; // stop at end
          deleting = true;
          timer = setTimeout(tick, pauseMs);
          return;
        }
        timer = setTimeout(tick, typingSpeed);
      } else {
        charCount -= 1;
        setDisplay(phrase.slice(0, Math.max(0, charCount)));
        if (charCount <= 0) {
          deleting = false;
          phraseIndex += 1;
          timer = setTimeout(tick, typingSpeed * 4); // brief beat before next
          return;
        }
        timer = setTimeout(tick, deletingSpeed);
      }
    };

    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer); // cleaned up on unmount / dep change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, key, typingSpeed, deletingSpeed, pauseMs, startDelay, loop]);

  return (
    <span className={`inline-flex max-w-full items-baseline ${className}`} aria-hidden="true">
      <span className="truncate">{display}</span>
      <motion.span
        className={`ml-0.5 inline-block h-[1.05em] w-[2px] shrink-0 translate-y-[2px] rounded-sm bg-iq-400 ${cursorClassName}`}
        initial={false}
        animate={reduce ? { opacity: 0.9 } : { opacity: [1, 1, 0, 0] }}
        transition={reduce ? undefined : { duration: 1.1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: 'linear' }}
      />
    </span>
  );
}
