import { CelestialStars } from './CelestialStars';
import { LIFT_DELAY_S, QUOTE_DELAY_S, TITLE_DELAY_S } from './splashSession';

export interface SplashGreetingProps {
  quote: string;
}

/**
 * The star, the greeting and the quote, stacked on the viewport centre.
 *
 * The star sits exactly where the static shell in `index.html` drew it, and the greeting
 * hangs below it, both matching the shell's geometry so the handover moves nothing.
 */
export function SplashGreeting({ quote }: SplashGreetingProps) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="h-[min(58vw,280px,44vh)] w-[min(58vw,280px,44vh)] [will-change:transform] motion-safe:animate-splash-lift"
        style={{ animationDelay: `${LIFT_DELAY_S}s` }}
      >
        <CelestialStars />
      </div>

      <div className="absolute left-1/2 top-full flex w-[min(88vw,40rem)] -translate-x-1/2 flex-col items-center gap-4 pt-6 text-center">
        <h1
          className="animate-splash-rise font-display text-3xl tracking-[0.08em] text-accent-cream [text-shadow:0_0_28px_rgba(201,169,97,0.35)] sm:text-4xl md:text-5xl"
          style={{ animationDelay: `${TITLE_DELAY_S}s` }}
        >
          Welcome to Dear Diary
        </h1>

        <figure
          className="animate-splash-rise flex flex-col items-center gap-3"
          style={{ animationDelay: `${QUOTE_DELAY_S}s` }}
        >
          <span
            aria-hidden="true"
            className="h-px w-16 bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
          />
          <blockquote className="font-sub text-base italic leading-relaxed text-accent-gold/90 sm:text-lg">
            &ldquo;{quote}&rdquo;
          </blockquote>
        </figure>
      </div>
    </div>
  );
}
