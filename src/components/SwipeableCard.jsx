import { useEffect, useRef, useState } from 'react'
import { SWIPE_DISTANCE_PX, swipeDecision } from '../utils/swipe'

const EXIT_MS = 280 // how long the fly-away animation takes
const START_DRAG_PX = 8 // smaller moves are taps, so links inside the card still work

/**
 * Makes its children draggable left / right, like Tinder.
 *   - drag far enough (or flick)  -> the card flies away, then onSwipe('left' | 'right')
 *   - let go too early            -> the card springs back
 *   - `exit` prop                 -> the ✕ / ♥ buttons fly the card away without dragging
 *
 * Uses Pointer Events, so the same code works for a finger, a mouse and a pen.
 *
 * @param {{ children: React.ReactNode, onSwipe: (dir: 'left' | 'right') => void, exit?: 'left' | 'right' | null }} props
 */
export default function SwipeableCard({ children, onSwipe, exit = null }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [leaving, setLeaving] = useState(null)

  // Drag details change on every pointer move but don't need a re-render, so a ref.
  const dragRef = useRef(null)
  const justDraggedRef = useRef(false)

  const direction = leaving ?? exit

  // Once the card starts flying away, tell the parent when the animation is done.
  // (Only `direction` matters here; this card is replaced right after.)
  useEffect(() => {
    if (!direction) return undefined
    const timer = setTimeout(() => onSwipe(direction), EXIT_MS)
    return () => clearTimeout(timer)
  }, [direction]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePointerDown(event) {
    if (direction) return
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      pointerId: event.pointerId,
      dx: 0,
      active: false,
    }
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY

    if (!drag.active) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > START_DRAG_PX) {
        dragRef.current = null // moving up/down: let the page scroll instead
        return
      }
      if (Math.abs(dx) < START_DRAG_PX) return // still just a tap
      drag.active = true
      setIsDragging(true)
      // Keep receiving moves even if the finger leaves the card.
      event.currentTarget.setPointerCapture(drag.pointerId)
    }

    drag.dx = dx
    setOffset({ x: dx, y: dy * 0.2 })
  }

  function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag?.active) return

    setIsDragging(false)
    justDraggedRef.current = true // the click that follows a drag must not open a link
    setTimeout(() => (justDraggedRef.current = false), 0)

    const decision = swipeDecision(drag.dx, performance.now() - drag.startTime)
    if (decision) setLeaving(decision)
    else setOffset({ x: 0, y: 0 }) // spring back to the middle
  }

  function handlePointerCancel() {
    dragRef.current = null
    setIsDragging(false)
    setOffset({ x: 0, y: 0 })
  }

  function handleClickCapture(event) {
    if (justDraggedRef.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // Where the card is drawn: following the finger, or flying off the screen.
  const flyDirection = direction === 'right' ? 1 : -1
  const transform = direction
    ? `translate(${flyDirection * 150}%, ${offset.y}px) rotate(${flyDirection * 25}deg)`
    : `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 15}deg)`

  // The stamps fade in as you drag towards them.
  const likeOpacity = direction === 'right' ? 1 : Math.min(Math.max(offset.x / SWIPE_DISTANCE_PX, 0), 1)
  const nopeOpacity = direction === 'left' ? 1 : Math.min(Math.max(-offset.x / SWIPE_DISTANCE_PX, 0), 1)

  return (
    <div
      className="relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
      style={{ transform, transition: isDragging ? 'none' : `transform ${EXIT_MS}ms ease-out` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
    >
      {children}

      <span
        className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-2xl border-4 border-candy-pink bg-white/90 px-3 py-1 text-2xl font-black text-candy-pink"
        style={{ opacity: likeOpacity }}
        aria-hidden="true"
      >
        YUM! 😋
      </span>
      <span
        className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-2xl border-4 border-slate-400 bg-white/90 px-3 py-1 text-2xl font-black text-slate-500"
        style={{ opacity: nopeOpacity }}
        aria-hidden="true"
      >
        NOPE 🙅
      </span>
    </div>
  )
}
