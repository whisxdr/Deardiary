import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover, GoldDust } from '@/components/book';
import { LandingHero } from '@/components/illustrations';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { hasKey, readJson } from '@/lib/storage';
import { useParallax } from './useParallax';
import { CoverActions } from './CoverActions';
import { CoverBookmark } from './CoverBookmark';
import { CoverDate } from './CoverDate';
import { CoverQuote } from './CoverQuote';
import { CoverTitle } from './CoverTitle';
import type { EntryDraft } from '@/types';

/** Cover page: leather book, daily quote and the two entry actions. */
export default function Landing() {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);
  const tilt = useParallax();

  const draftId = useMemo(() => {
    const draft = readJson<Partial<EntryDraft> & { id?: string } | null>(STORAGE_KEYS.draft, null);
    return draft?.id ?? null;
  }, []);

  const openBook = () => {
    setIsOpening(true);
    window.setTimeout(() => navigate(ROUTES.dashboard), 800);
  };

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
              hasDraft={hasKey(STORAGE_KEYS.draft)}
              onOpen={openBook}
              onContinue={() => navigate(draftId ? ROUTES.writeEntry(draftId) : ROUTES.write)}
              isOpening={isOpening}
            />
          </div>
        </BookCover>
      </motion.div>
    </main>
  );
}
