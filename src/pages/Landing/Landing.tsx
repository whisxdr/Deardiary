import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover, GoldDust } from '@/components/book';
import { LandingHero } from '@/components/illustrations';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { hasKey } from '@/lib/storage';
import { useParallax } from './useParallax';
import { CoverActions } from './CoverActions';
import { CoverBookmark } from './CoverBookmark';
import { CoverDate } from './CoverDate';
import { CoverQuote } from './CoverQuote';
import { CoverTitle } from './CoverTitle';

/** Cover page: leather book, daily quote and the two entry actions. */
export default function Landing() {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const tilt = useParallax();
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

  const openBook = useCallback(() => {
    setIsOpening(true);
    openTimer.current = window.setTimeout(() => navigate(ROUTES.dashboard), 800);
  }, [navigate]);

  const continueWriting = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    navigate(ROUTES.write);
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-900 px-4 py-10 leather-texture">
      <GoldDust />
      <motion.div
        className="relative w-full max-w-3xl"
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        style={{ transformPerspective: 1200 }}
      >
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
      </motion.div>
    </main>
  );
}

