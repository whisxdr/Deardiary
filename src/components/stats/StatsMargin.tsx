/**
 * Statistics page — the margin furniture beside the ledger.
 *
 * On wide desktops the centred ledger leaves a quiet gutter on either side; this
 * layer fills them with hand-made touches so the page no longer reads as empty,
 * while staying well clear of the central sheet's text.
 *
 * Left margin (an archivist's marginalia): a vertical folio label, an italic
 * aside, a line-art pen nib and a dotted rule. Right margin (the desk beside the
 * diary): a vertical pagination label, a line-art cup of tea, an italic aside and
 * a perforated stamp.
 *
 * Everything here is decorative — the layer is `aria-hidden`, every element uses
 * `pointer-events: none` (via the `.stats-margin` layer), and it is fixed to the
 * viewport so it escapes the `max-w-7xl` column. Colours, opacities, positioning
 * and the `<1280px` hide live in `stats-margin.css`.
 */

/** A fountain-pen nib, drawn as a single stroke outline. */
function NibIllustration() {
  return (
    <svg
      className="stats-margin__art stats-margin__art--tilt"
      width="52"
      height="52"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 7h22v9c0 9-7 15-11 21-4-6-11-12-11-21z" />
      <path d="M24 28v9" />
      <circle cx="24" cy="18" r="2" />
    </svg>
  );
}

/** A cup of tea with a little steam. */
function TeaIllustration() {
  return (
    <svg
      className="stats-margin__art stats-margin__art--tilt-alt"
      width="56"
      height="56"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 11c0-2 2.5-2 2.5-4" />
      <path d="M26 11c0-2 2.5-2 2.5-4" />
      <path d="M11 19h22v8a11 11 0 0 1-22 0z" />
      <path d="M33 21h3.5a4.5 4.5 0 0 1 0 9H33" />
      <path d="M9 40h26" />
    </svg>
  );
}

/** A perforated postage stamp with a tiny landscape inside. */
function StampIllustration() {
  return (
    <svg
      className="stats-margin__stamp"
      width="46"
      height="54"
      viewBox="0 0 48 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="38" height="46" rx="2.5" strokeDasharray="3.5 3" />
      <circle cx="31" cy="17" r="3" />
      <path d="M13 33l7-11 6 9 4-5 6 7z" />
      <path d="M12 43h24" />
    </svg>
  );
}

/** The decorative gutter layer for the statistics page. Purely presentational. */
export function StatsMargin() {
  return (
    <div className="stats-margin" aria-hidden="true">
      <div className="stats-margin__col stats-margin__col--left">
        <span className="stats-margin__label">Folio No. {new Date().getFullYear()}</span>
        <p className="stats-margin__note">a line a day still counts</p>
        <NibIllustration />
        <span className="stats-margin__rule" />
      </div>

      <div className="stats-margin__col stats-margin__col--right">
        <span className="stats-margin__label">p. 01 — 12</span>
        <TeaIllustration />
        <p className="stats-margin__note">it’s not the count — it’s the stopping to write</p>
        <StampIllustration />
      </div>
    </div>
  );
}
