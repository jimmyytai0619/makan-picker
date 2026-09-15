// Pure helpers for the fun loading screen (easy to test: time in -> text/number out).

export const LOADING_MESSAGES = [
  'Asking the mamak uncle… 🧔',
  'Sniffing for nasi lemak… 🍛',
  'Flipping roti canai… 🫓',
  'Pulling the teh tarik… 🧋',
  'Counting satay sticks… 🍢',
  'Checking which kopitiam got aircond… ❄️',
  'Waking up the char kuey teow wok… 🔥',
  "Asking aunty 'makan apa?'… 👵",
]

// After a while, be honest that it's slow (the free map server takes up to ~30 s).
export const SLOW_MESSAGES = [
  'The free map is slow today, almost there! 🐢',
  'Still cooking… good food takes time 🍳',
  'Almost ready, catch more snacks! 😋',
]

export const MESSAGE_EVERY_MS = 2200
export const SLOW_AFTER_MS = 10000

/** Which message to show after `elapsedMs` milliseconds of searching. */
export function loadingMessage(elapsedMs) {
  const step = Math.floor(elapsedMs / MESSAGE_EVERY_MS)
  if (elapsedMs >= SLOW_AFTER_MS) return SLOW_MESSAGES[step % SLOW_MESSAGES.length]
  return LOADING_MESSAGES[step % LOADING_MESSAGES.length]
}

/**
 * A "pretend" progress bar (0–90 %). We can't know how long the map server
 * will take, so it moves fast at first and then slows down, never reaching
 * 100 % until the places really arrive (then the screen simply changes).
 */
export function fakeProgress(elapsedMs) {
  return 90 * (1 - Math.exp(-Math.max(elapsedMs, 0) / 8000))
}
