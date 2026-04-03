import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon,
  BrainIcon,
  Search01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'
import { TeachFlashcard } from '@/screens/chat/components/teach-flashcard'
import { cn } from '@/lib/utils'

// Types for flashcard data from the local store
type FlashcardEntry = {
  id: string
  front: string
  back: string
  domain: string
  source: string
  tags: string[]
  created: string
  repetition: number
  ease_factor: number
  interval: number
  next_review: string
  last_reviewed: string | null
  review_count: number
  correct_count: number
}

type LearningStats = {
  total_cards: number
  due_today: number
  new: number
  learning: number
  mature: number
  total_reviews: number
  accuracy_percent: number
  domains: Record<string, number>
  upcoming_week: number
}

type ViewMode = 'dashboard' | 'review' | 'browse'

const DOMAIN_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cs: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  science: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  history: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  literature: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  language: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  philosophy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  economics: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  art: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',
}

async function fetchFlashcards(): Promise<FlashcardEntry[]> {
  try {
    const response = await fetch('/api/flashcards')
    if (!response.ok) return []
    const data = await response.json()
    return data.cards ?? []
  } catch {
    return []
  }
}

async function fetchStats(): Promise<LearningStats | null> {
  try {
    const response = await fetch('/api/flashcards/stats')
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

function StatCard({
  label,
  value,
  sublabel,
  color = 'text-primary-900',
}: {
  label: string
  value: string | number
  sublabel?: string
  color?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-primary-200 bg-white/60 px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">
        {label}
      </span>
      <span className={cn('text-2xl font-bold tabular-nums', color)}>
        {value}
      </span>
      {sublabel && (
        <span className="text-[11px] text-primary-500">{sublabel}</span>
      )}
    </div>
  )
}

function DomainChart({ domains }: { domains: Record<string, number> }) {
  const entries = Object.entries(domains).sort((a, b) => b[1] - a[1])
  const maxCount = Math.max(...entries.map(([, count]) => count), 1)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">
        Cards by Domain
      </p>
      <div className="flex flex-col gap-1.5">
        {entries.map(([domain, count]) => (
          <div key={domain} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex w-20 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.general,
              )}
            >
              {domain}
            </span>
            <div className="flex-1 h-2 rounded-full bg-primary-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxCount) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-primary-400"
              />
            </div>
            <span className="text-xs tabular-nums text-primary-600 w-6 text-right">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewQueue({
  cards,
  onRate,
}: {
  cards: FlashcardEntry[]
  onRate: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentCard = cards[currentIndex]
  const remaining = cards.length - currentIndex

  const handleRate = useCallback(
    (rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!currentCard) return
      onRate(currentCard.id, rating)
      setCurrentIndex((prev) => prev + 1)
    },
    [currentCard, onRate],
  )

  if (!currentCard) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-3 py-12"
      >
        <span className="text-4xl">🎉</span>
        <p className="text-lg font-medium text-primary-800">
          All caught up!
        </p>
        <p className="text-sm text-primary-500">
          No more cards due for review today.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary-600">
          Card {currentIndex + 1} of {cards.length}
        </p>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            DOMAIN_COLORS[currentCard.domain] ?? DOMAIN_COLORS.general,
          )}
        >
          {currentCard.domain}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-primary-100 overflow-hidden">
        <motion.div
          animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full bg-green-500"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <TeachFlashcard
            front={currentCard.front}
            back={currentCard.back}
            onRate={handleRate}
          />
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-primary-400">
        {remaining - 1} card{remaining - 1 !== 1 ? 's' : ''} remaining
      </p>
    </div>
  )
}

function CardBrowser({
  cards,
  searchQuery,
}: {
  cards: FlashcardEntry[]
  searchQuery: string
}) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return cards

    const query = searchQuery.toLowerCase()
    return cards.filter(
      (card) =>
        card.front.toLowerCase().includes(query) ||
        card.back.toLowerCase().includes(query) ||
        card.domain.toLowerCase().includes(query) ||
        card.source.toLowerCase().includes(query),
    )
  }, [cards, searchQuery])

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <span className="text-2xl">📚</span>
        <p className="text-sm text-primary-500">
          {searchQuery ? 'No cards match your search.' : 'No flashcards yet. Use /teach to start learning!'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {filtered.map((card) => {
        const daysUntilReview = Math.ceil(
          (new Date(card.next_review).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
        const isDue = daysUntilReview <= 0
        const reviewLabel = isDue
          ? 'Due now'
          : `In ${daysUntilReview}d`

        return (
          <div
            key={card.id}
            className="rounded-lg border border-primary-200 bg-white/60 px-4 py-3 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {card.front}
                </p>
                <p className="mt-0.5 text-xs text-primary-500 truncate">
                  {card.back}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    DOMAIN_COLORS[card.domain] ?? DOMAIN_COLORS.general,
                  )}
                >
                  {card.domain}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isDue ? 'text-red-600' : 'text-primary-400',
                  )}
                >
                  {reviewLabel}
                </span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-primary-400">
              <span>Rep: {card.repetition}</span>
              <span>EF: {card.ease_factor}</span>
              <span>Reviews: {card.review_count}</span>
              {card.review_count > 0 && (
                <span>
                  Accuracy: {Math.round((card.correct_count / card.review_count) * 100)}%
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function LearnScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [cards, setCards] = useState<FlashcardEntry[]>([])
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [fetchedCards, fetchedStats] = await Promise.all([
        fetchFlashcards(),
        fetchStats(),
      ])
      setCards(fetchedCards)
      setStats(fetchedStats)
      setIsLoading(false)
    }
    load()
  }, [])

  const dueCards = useMemo(() => {
    const now = Date.now()
    return cards.filter((c) => new Date(c.next_review).getTime() <= now)
  }, [cards])

  const refreshData = useCallback(async () => {
    const [freshCards, freshStats] = await Promise.all([
      fetchFlashcards(),
      fetchStats(),
    ])
    setCards(freshCards)
    setStats(freshStats)
  }, [])

  const handleRate = useCallback(
    async (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
      const ratingMap = { again: 0, hard: 3, good: 4, easy: 5 }
      try {
        await fetch('/api/flashcards/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId, quality: ratingMap[rating] }),
        })
        // Refresh data after rating to keep stats current
        void refreshData()
      } catch {
        // Silently handle — card was still shown
      }
    },
    [refreshData],
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-primary-500">
          <span className="size-2 animate-bounce rounded-full bg-primary-400" />
          <span className="text-sm">Loading learning data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            icon={BookOpen01Icon}
            size={24}
            strokeWidth={1.5}
            className="text-primary-600"
          />
          <h1 className="text-xl font-semibold text-primary-950">
            Learning Dashboard
          </h1>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center rounded-lg border border-primary-200 bg-primary-50/50 p-0.5">
          {(['dashboard', 'review', 'browse'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === mode
                  ? 'bg-white text-primary-900 shadow-sm'
                  : 'text-primary-500 hover:text-primary-700',
              )}
            >
              {mode === 'dashboard' && 'Overview'}
              {mode === 'review' && `Review${dueCards.length > 0 ? ` (${dueCards.length})` : ''}`}
              {mode === 'browse' && 'Browse'}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-6"
        >
          {/* Stats grid */}
          {stats && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Total Cards"
                  value={stats.total_cards}
                />
                <StatCard
                  label="Due Today"
                  value={stats.due_today}
                  color={stats.due_today > 0 ? 'text-red-600' : 'text-green-600'}
                />
                <StatCard
                  label="Accuracy"
                  value={`${stats.accuracy_percent}%`}
                  color={stats.accuracy_percent >= 80 ? 'text-green-600' : 'text-amber-600'}
                />
                <StatCard
                  label="This Week"
                  value={stats.upcoming_week}
                  sublabel="upcoming reviews"
                />
              </div>

              {/* Progress breakdown */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-primary-200 bg-white/60 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
                    Card Progress
                  </p>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold text-blue-600 tabular-nums">
                        {stats.new}
                      </span>
                      <span className="text-[10px] text-primary-500">New</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold text-amber-600 tabular-nums">
                        {stats.learning}
                      </span>
                      <span className="text-[10px] text-primary-500">Learning</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold text-green-600 tabular-nums">
                        {stats.mature}
                      </span>
                      <span className="text-[10px] text-primary-500">Mature</span>
                    </div>
                  </div>

                  {/* Stacked bar */}
                  {stats.total_cards > 0 && (
                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-primary-100">
                      <div
                        className="bg-blue-400 transition-all"
                        style={{ width: `${(stats.new / stats.total_cards) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${(stats.learning / stats.total_cards) * 100}%` }}
                      />
                      <div
                        className="bg-green-400 transition-all"
                        style={{ width: `${(stats.mature / stats.total_cards) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-primary-200 bg-white/60 p-4">
                  <DomainChart domains={stats.domains} />
                </div>
              </div>
            </>
          )}

          {/* Quick action */}
          {dueCards.length > 0 && (
            <button
              onClick={() => setViewMode('review')}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 text-sm font-medium text-primary-800 hover:from-primary-100 hover:to-primary-150 transition-colors"
            >
              <HugeiconsIcon icon={BrainIcon} size={16} strokeWidth={1.5} />
              Review {dueCards.length} due card{dueCards.length !== 1 ? 's' : ''}
            </button>
          )}

          {/* Empty state */}
          {cards.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <span className="text-4xl">📖</span>
              <p className="text-lg font-medium text-primary-800">
                Start learning!
              </p>
              <p className="max-w-sm text-center text-sm text-primary-500">
                Use <code className="rounded bg-primary-100 px-1.5 py-0.5 text-xs">/teach</code> in
                chat to learn about any topic. Flashcards will appear here automatically.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Review View */}
      {viewMode === 'review' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto w-full max-w-lg"
        >
          <ReviewQueue cards={dueCards} onRate={handleRate} />
        </motion.div>
      )}

      {/* Browse View */}
      {viewMode === 'browse' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          {/* Search bar */}
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search flashcards..."
              className="w-full rounded-lg border border-primary-200 bg-white/60 py-2 pl-9 pr-3 text-sm text-primary-900 placeholder-primary-400 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
            />
          </div>

          <CardBrowser cards={cards} searchQuery={searchQuery} />
        </motion.div>
      )}
    </div>
  )
}
