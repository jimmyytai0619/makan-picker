/**
 * The ✕ / ♥ buttons under the swipe card. It doesn't know WHAT skip/like do —
 * the parent passes those functions in. That keeps this reusable.
 *
 * @param {{ onSkip: () => void, onLike: () => void, disabled?: boolean }} props
 */
export default function ActionButtons({ onSkip, onLike, disabled = false }) {
  return (
    <div className="flex items-center justify-center gap-8">
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
    </div>
  )
}
