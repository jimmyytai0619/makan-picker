import { describe, expect, it } from 'vitest'
import {
  LOADING_MESSAGES,
  MESSAGE_EVERY_MS,
  SLOW_AFTER_MS,
  SLOW_MESSAGES,
  fakeProgress,
  loadingMessage,
} from './loading'

describe('loadingMessage', () => {
  it('starts with the first fun message', () => {
    expect(loadingMessage(0)).toBe(LOADING_MESSAGES[0])
  })

  it('changes message every few seconds', () => {
    expect(loadingMessage(MESSAGE_EVERY_MS)).toBe(LOADING_MESSAGES[1])
  })

  it('switches to "it is slow" messages after a while', () => {
    expect(SLOW_MESSAGES).toContain(loadingMessage(SLOW_AFTER_MS))
    expect(SLOW_MESSAGES).toContain(loadingMessage(25000))
  })
})

describe('fakeProgress', () => {
  it('starts at 0 and only goes up', () => {
    expect(fakeProgress(0)).toBe(0)
    expect(fakeProgress(2000)).toBeGreaterThan(fakeProgress(1000))
  })

  it('moves quickly at first', () => {
    expect(fakeProgress(8000)).toBeGreaterThan(50)
  })

  it('never reaches 100 % on its own', () => {
    expect(fakeProgress(120000)).toBeLessThanOrEqual(90)
  })
})
