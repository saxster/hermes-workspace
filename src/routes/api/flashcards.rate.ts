import { createFileRoute } from '@tanstack/react-router'
import { requireLocalOrAuth } from '../../server/auth-middleware'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const FLASHCARD_DIR = join(homedir(), '.hermes', 'flashcards')
const INDEX_FILE = join(FLASHCARD_DIR, 'index.json')

type Card = Record<string, unknown>

async function loadCards(): Promise<Card[]> {
  if (!existsSync(INDEX_FILE)) return []
  try {
    const raw = await readFile(INDEX_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveCards(cards: Card[]): Promise<void> {
  if (!existsSync(FLASHCARD_DIR)) {
    mkdirSync(FLASHCARD_DIR, { recursive: true })
  }
  await writeFile(INDEX_FILE, JSON.stringify(cards, null, 2))
}

/**
 * SM-2 algorithm implementation.
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

export const Route = createFileRoute('/api/flashcards/rate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!requireLocalOrAuth(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { card_id, quality } = body as {
          card_id?: string
          quality?: number
        }

        if (!card_id || quality === undefined) {
          return Response.json(
            { error: 'card_id and quality are required' },
            { status: 400 },
          )
        }

        if (![0, 3, 4, 5].includes(quality)) {
          return Response.json(
            { error: 'quality must be 0 (again), 3 (hard), 4 (good), or 5 (easy)' },
            { status: 400 },
          )
        }

        const cards = await loadCards()
        const cardIndex = cards.findIndex((c) => c.id === card_id)

        if (cardIndex === -1) {
          return Response.json({ error: 'Card not found' }, { status: 404 })
        }

        const card = cards[cardIndex]!
        const result = sm2Schedule(
          quality,
          (card.repetition as number) ?? 0,
          (card.ease_factor as number) ?? 2.5,
          (card.interval as number) ?? 0,
        )

        const nextReview = new Date(
          Date.now() + result.interval * 24 * 60 * 60 * 1000,
        ).toISOString()

        card.repetition = result.repetition
        card.ease_factor = result.easeFactor
        card.interval = result.interval
        card.next_review = nextReview
        card.last_reviewed = new Date().toISOString()
        card.review_count = ((card.review_count as number) ?? 0) + 1
        if (quality >= 3) {
          card.correct_count = ((card.correct_count as number) ?? 0) + 1
        }

        await saveCards(cards)

        return Response.json({
          card,
          next_review_days: result.interval,
        })
      },
    },
  },
})
