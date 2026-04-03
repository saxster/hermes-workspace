import { describe, expect, it } from 'vitest'

/**
 * Unit tests for the SM-2 algorithm used in the flashcard rate endpoint.
 * Extracted here to test the pure function independently of the route handler.
 */

function sm2Schedule(
  quality: number,
  repetition: number,
  easeFactor: number,
  interval: number,
): { repetition: number; easeFactor: number; interval: number } {
  if (quality < 3) {
    return { repetition: 0, easeFactor, interval: 1 }
  }

  let newInterval: number
  if (repetition === 0) {
    newInterval = 1
  } else if (repetition === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * easeFactor)
  }

  const adjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  const newEaseFactor = Math.max(1.3, easeFactor + adjustment)

  return {
    repetition: repetition + 1,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
  }
}

describe('SM-2 Schedule (TypeScript)', () => {
  it('resets on failure (quality < 3)', () => {
    const result = sm2Schedule(0, 5, 2.5, 30)
    expect(result.repetition).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBe(2.5) // unchanged
  })

  it('first successful recall gives interval of 1', () => {
    const result = sm2Schedule(4, 0, 2.5, 0)
    expect(result.repetition).toBe(1)
    expect(result.interval).toBe(1)
  })

  it('second successful recall gives interval of 6', () => {
    const result = sm2Schedule(4, 1, 2.5, 1)
    expect(result.repetition).toBe(2)
    expect(result.interval).toBe(6)
  })

  it('third recall uses ease factor multiplication', () => {
    const result = sm2Schedule(4, 2, 2.5, 6)
    expect(result.repetition).toBe(3)
    expect(result.interval).toBe(15) // round(6 * 2.5)
  })

  it('quality 5 increases ease factor', () => {
    const result = sm2Schedule(5, 0, 2.5, 0)
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  it('quality 3 decreases ease factor', () => {
    const result = sm2Schedule(3, 0, 2.5, 0)
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  it('ease factor never goes below 1.3', () => {
    const result = sm2Schedule(3, 0, 1.3, 0)
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('long streak produces large intervals', () => {
    let rep = 0
    let ef = 2.5
    let interval = 0

    for (let i = 0; i < 10; i++) {
      const result = sm2Schedule(4, rep, ef, interval)
      rep = result.repetition
      ef = result.easeFactor
      interval = result.interval
    }

    expect(interval).toBeGreaterThan(100)
  })

  it('recovery after failure restarts the progression', () => {
    // Build up to rep 3
    let { repetition, easeFactor, interval } = sm2Schedule(4, 0, 2.5, 0)
    ;({ repetition, easeFactor, interval } = sm2Schedule(4, repetition, easeFactor, interval))
    ;({ repetition, easeFactor, interval } = sm2Schedule(4, repetition, easeFactor, interval))
    expect(repetition).toBe(3)

    // Fail
    ;({ repetition, easeFactor, interval } = sm2Schedule(0, repetition, easeFactor, interval))
    expect(repetition).toBe(0)
    expect(interval).toBe(1)

    // Recover
    ;({ repetition, easeFactor, interval } = sm2Schedule(4, repetition, easeFactor, interval))
    expect(repetition).toBe(1)
    expect(interval).toBe(1)
  })
})
