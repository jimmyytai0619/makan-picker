/**
 * The ↩️ / ✕ / ♥ buttons under the swipe card. It doesn't know WHAT undo/skip/like do —
 * the parent passes those functions in. That keeps this reusable.
 *
 * @param {{
 *   onSkip: () => void,
 *   onLike: () => void,
 *   onUndo?: () => void,
 *   canUndo?: boolean,
 *   disabled?: boolean,
 * }} props
 */
export default function ActionButtons({ onSkip, onLike, onUndo, canUndo = false, disabled = false }) {
  return (
    <div className="flex items-center justify-center gap-6">
      {onUndo && (
        <button
          type="button"
          aria-label="Undo last swipe"
          title="Undo last swipe (Backspace)"
          onClick={onUndo}
          disabled={disabled || !canUndo}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-candy-butter text-xl shadow-md ring-1 ring-amber-100 transition hover:scale-105 active:scale-90 disabled:opacity-40"
        >
          ↩️
        </button>
      )}
      <button
        type="button"
        aria-label="Skip"
        onClick={onSkip}
        disabled={disabled}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl font-black text-slate-400 shadow-lg ring-1 ring-slate-100 transition hover:scale-105 active:scale-90 disabled:opacity-40"
      >
        ✕
      </button>
      <button
        type="button"
        aria-label="Like"
        onClick={onLike}
        disabled={disabled}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-candy-pink to-[#ffa3c0] text-4xl text-white shadow-xl shadow-candy-pink/40 transition hover:scale-105 active:scale-90 disabled:opacity-40"
      >
        ♥
      </button>
      {/* Empty space as wide as ↩️, so ✕ and ♥ stay in the middle of the screen */}
      {onUndo && <span className="h-12 w-12" aria-hidden="true" />}
    </div>
  )
}
