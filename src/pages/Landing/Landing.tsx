import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Imported from their own modules rather than the `@/components/book` barrel: that barrel
// also exports BookFlip and Bookmark, which import Framer Motion. Landing is the first
// paint for every visitor, so pulling the animation library in through the barrel would
// put it in the initial bundle for a page that no longer animates with it.
import { BookCover } from '@/components/book/BookCover';
import { GoldDust } from '@/components/book/GoldDust';
import { LandingHero } from '@/components/illustrations';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { hasKey } from '@/lib/storage';
import { useParallax } from './useParallax';
import { CoverActions } from './CoverActions';
import { CoverBookmark } from './CoverBookmark';
import { CoverDate } from './CoverDate';
import { CoverQuote } from './CoverQuote';
import { CoverTitle } from './CoverTitle';

/**
 * Cover page: leather book, daily quote and the two entry actions.
 *
 * The tilt reads `--tilt-x` / `--tilt-y` from this element, written by `useParallax`
 * without a re-render. Framer Motion is not used here: this is the first page every
 * visitor loads, and the animation library cost more than the effect it drew.
 */
export default function Landing() {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const tiltRef = useParallax<HTMLDivElement>(6);
  const openTimer = useRef<number | null>(null);

  // A draft is stored without an id, so "Continue writing" always opens the composer,
  // which reloads the draft from storage.
  const hasDraft = hasKey(STORAGE_KEYS.draft);

  // The cover animation delays navigation; clear the timer so leaving early (or
  // clicking "Continue writing" during the animation) cannot hijack the next page.
  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    },
    [],
  );

  // Warms the dashboard route while the visitor reads the cover. Opening the book is the
  // next action almost every visitor takes, and that route is lazy, so without this its
  // ~20-request cascade starts only after the click. Loading a module has no side effects
  // here: it fetches the code and defines the components without rendering or touching
  // the stores.
  useEffect(() => {
    const warm = () => {
      void import('@/pages/Dashboard/Dashboard');
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(warm, 800);
    return () => window.clearTimeout(timer);
  }, []);

  const openBook = useCallback(() => {
    setIsOpening(true);
    openTimer.current = window.setTimeout(() => navigate(ROUTES.dashboard), 800);
  }, [navigate]);

  const continueWriting = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    // `resume` is what tells the composer to load the stored draft. Plain /write opens a
    // clean page, so every "New entry" button starts empty.
    navigate(`${ROUTES.write}?resume=true`);
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-900 px-4 py-10 leather-texture">
      <GoldDust />
      <div ref={tiltRef} className="cover-tilt relative w-full max-w-3xl">
        <BookCover>
          <CoverBookmark />
          <div className="flex flex-col items-center gap-6 pt-8">
            <CoverDate />
            <CoverTitle />
            <LandingHero size={260} className="opacity-90" />
            <CoverQuote />
            <CoverActions
              hasDraft={hasDraft}
              onOpen={openBook}
              onContinue={continueWriting}
              isOpening={isOpening}
            />
          </div>
        </BookCover>
      </div>
    </main>
  );
}
