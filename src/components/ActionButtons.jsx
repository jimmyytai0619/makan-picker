/**
 * The ✕ / ♥ buttons under the card. It doesn't know WHAT skip/like do —
 * the parent passes those functions in. That keeps this reusable.
 *
 * @param {{ onSkip: () => void, onLike: () => void, disabled?: boolean }} props
 */
export default function ActionButtons({ onSkip, onLike, disabled = false }) {
  const base =
    'flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-md ' +
    'transition active:scale-90 disabled:opacity-40'

  return (
    <div className="flex justify-center gap-10">
      <button
        type="button"
        aria-label="Skip"
        onClick={onSkip}
        disabled={disabled}
        className={`${base} bg-white text-gray-500`}
      >
        ✕
      </button>
      <button
        type="button"
        aria-label="Like"
        onClick={onLike}
        disabled={disabled}
        className={`${base} bg-orange-500 text-white`}
      >
        ♥
      </button>
    </div>
  )
}
