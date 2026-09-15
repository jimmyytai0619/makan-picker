import { useEffect } from 'react'

/**
 * Pops up after your 2nd swipe right: decide now (spin or list), or keep swiping.
 *
 * @param {{ count: number, onSpin: () => void, onList: () => void, onClose: () => void }} props
 */
export default function PicksPrompt({ count, onSpin, onList, onClose }) {
  // Escape closes it, like most pop-ups.
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    // Clicking the dark background closes it too.
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-plum/30 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picks-prompt-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-pop rounded-[2rem] bg-white p-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()} // clicks inside must not close it
      >
        <p className="text-5xl" aria-hidden="true">
          💖
        </p>
        <h2 id="picks-prompt-title" className="mt-2 text-xl font-black text-plum">
          You have {count} picks!
        </h2>
        <p className="text-sm text-plum/60">Choose now, or keep swiping for more.</p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={onSpin}
            className="rounded-full bg-candy-pink py-3.5 font-black text-white shadow-lg shadow-candy-pink/30 transition active:scale-95"
          >
            🎡 Spin to choose
          </button>
          <button
            onClick={onList}
            className="rounded-full bg-candy-pink-soft py-3.5 font-black text-candy-pink transition active:scale-95"
          >
            📋 See my list
          </button>
          <button onClick={onClose} className="py-2 text-sm font-bold text-plum/50">
            👆 Keep swiping
          </button>
        </div>
      </div>
    </div>
  )
}
