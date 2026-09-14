import { useState } from 'react'

const PIECES = ['💖', '✨', '🍬', '🌸', '⭐', '🍭']

/**
 * A burst of cute confetti falling over its parent. Pure CSS animation (see
 * `animate-confetti` in index.css), no library. Hidden if "Reduce motion" is on.
 */
export default function Confetti({ count = 28 }) {
  // Random positions are made ONCE, when the confetti appears (useState's first value).
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: PIECES[i % PIECES.length],
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 160,
      rotate: (Math.random() - 0.5) * 720,
      delay: Math.random() * 250,
      size: 14 + Math.random() * 14,
    })),
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-0 animate-confetti motion-reduce:hidden"
          style={{
            left: `${piece.left}%`,
            fontSize: piece.size,
            animationDelay: `${piece.delay}ms`,
            '--dx': `${piece.dx}px`,
            '--rotate': `${piece.rotate}deg`,
          }}
        >
          {piece.emoji}
        </span>
      ))}
    </div>
  )
}
