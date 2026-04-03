import { createFileRoute } from '@tanstack/react-router'
import { requireLocalOrAuth } from '../../server/auth-middleware'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const INDEX_FILE = join(homedir(), '.hermes', 'flashcards', 'index.json')

type Card = {
  repetition: number
  next_review: string
  review_count: number
  correct_count: number
  domain: string
}

async function loadCards(): Promise<Card[]> {
  if (!existsSync(INDEX_FILE)) return []
  try {
    const raw = await readFile(INDEX_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const Route = createFileRoute('/api/flashcards/stats')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!requireLocalOrAuth(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const cards = await loadCards()
        const now = Date.now()

        const total = cards.length
        const dueToday = cards.filter(
          (c) => new Date(c.next_review).getTime() <= now,
        ).length
        const newCards = cards.filter((c) => c.repetition === 0).length
        const learning = cards.filter(
          (c) => c.repetition > 0 && c.repetition <= 2,
        ).length
        const mature = cards.filter((c) => c.repetition > 2).length

        const totalReviews = cards.reduce(
          (sum, c) => sum + (c.review_count ?? 0),
          0,
        )
        const totalCorrect = cards.reduce(
          (sum, c) => sum + (c.correct_count ?? 0),
          0,
        )
        const accuracy =
          totalReviews > 0
            ? Math.round((totalCorrect / totalReviews) * 1000) / 10
            : 0

        const domains: Record<string, number> = {}
        for (const card of cards) {
          const domain = card.domain ?? 'general'
          domains[domain] = (domains[domain] ?? 0) + 1
        }

        const weekFromNow = now + 7 * 24 * 60 * 60 * 1000
        const upcomingWeek = cards.filter((c) => {
          const reviewTime = new Date(c.next_review).getTime()
          return reviewTime > now && reviewTime <= weekFromNow
        }).length

        return Response.json({
          total_cards: total,
          due_today: dueToday,
          new: newCards,
          learning,
          mature,
          total_reviews: totalReviews,
          accuracy_percent: accuracy,
          domains,
          upcoming_week: upcomingWeek,
        })
      },
    },
  },
})
