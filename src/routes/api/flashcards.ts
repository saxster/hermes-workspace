import { createFileRoute } from '@tanstack/react-router'
import { requireLocalOrAuth } from '../../server/auth-middleware'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const FLASHCARD_DIR = join(homedir(), '.hermes', 'flashcards')
const INDEX_FILE = join(FLASHCARD_DIR, 'index.json')

function ensureDir() {
  if (!existsSync(FLASHCARD_DIR)) {
    mkdirSync(FLASHCARD_DIR, { recursive: true })
  }
}

async function loadCards(): Promise<Array<Record<string, unknown>>> {
  ensureDir()
  if (!existsSync(INDEX_FILE)) return []
  try {
    const raw = await readFile(INDEX_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveCards(cards: Array<Record<string, unknown>>): Promise<void> {
  ensureDir()
  await writeFile(INDEX_FILE, JSON.stringify(cards, null, 2))
}

export const Route = createFileRoute('/api/flashcards')({
  server: {
    handlers: {
      // Get all flashcards
      GET: async ({ request }) => {
        if (!requireLocalOrAuth(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cards = await loadCards()
        return Response.json({ cards })
      },

      // Add a new flashcard
      POST: async ({ request }) => {
        if (!requireLocalOrAuth(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { front, back, domain, source, tags } = body as {
          front?: string
          back?: string
          domain?: string
          source?: string
          tags?: string[]
        }

        if (!front || !back) {
          return Response.json(
            { error: 'front and back are required' },
            { status: 400 },
          )
        }

        const cards = await loadCards()

        // Deduplication: check if a card with very similar front text already exists
        const normalizedFront = front.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
        const isDuplicate = cards.some((existing) => {
          const existingFront = String(existing.front ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
          return existingFront === normalizedFront
        })

        if (isDuplicate) {
          return Response.json(
            { error: 'duplicate', message: 'A card with a similar question already exists' },
            { status: 409 },
          )
        }

        const id = Math.random().toString(36).slice(2, 10)
        const card = {
          id,
          front,
          back,
          domain: domain ?? 'general',
          source: source ?? '',
          tags: tags ?? [],
          created: new Date().toISOString(),
          repetition: 0,
          ease_factor: 2.5,
          interval: 0,
          next_review: new Date().toISOString(),
          last_reviewed: null,
          review_count: 0,
          correct_count: 0,
        }

        cards.push(card)
        await saveCards(cards)

        return Response.json({ card }, { status: 201 })
      },
    },
  },
})
