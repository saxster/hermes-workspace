import { memo, useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { Markdown } from '@/components/prompt-kit/markdown'
import { cn } from '@/lib/utils'

type TeachFlashcardProps = {
  front: string
  back: string
  onRate?: (rating: 'again' | 'hard' | 'good' | 'easy') => void
  className?: string
}

const TeachFlashcard = memo(function TeachFlashcard({
  front,
  back,
  onRate,
  className,
}: TeachFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [rated, setRated] = useState(false)

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handleRate = useCallback(
    (rating: 'again' | 'hard' | 'good' | 'easy') => {
      setRated(true)
      onRate?.(rating)
    },
    [onRate],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        handleFlip()
      }
      if (isFlipped && !rated) {
        if (event.key === '1') handleRate('again')
        if (event.key === '2') handleRate('hard')
        if (event.key === '3') handleRate('good')
        if (event.key === '4') handleRate('easy')
      }
    },
    [handleFlip, handleRate, isFlipped, rated],
  )

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        className="relative cursor-pointer select-none"
        style={{ perspective: '800px' }}
        aria-label={isFlipped ? 'Flashcard answer (click to flip)' : 'Flashcard question (click to flip)'}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative min-h-[100px]"
        >
          {/* Front */}
          <div
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center rounded-lg border border-primary-200 bg-white px-4 py-4 text-center',
              'backface-hidden',
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
              Question
            </p>
            <Markdown className="text-sm font-medium text-primary-900 leading-relaxed">
              {front}
            </Markdown>
            <p className="mt-2 text-[10px] text-primary-400">
              Click or press Space to reveal
            </p>
          </div>

          {/* Back */}
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50/50 px-4 py-4 text-center',
              'backface-hidden',
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-green-600">
              Answer
            </p>
            <Markdown className="text-sm text-green-900 leading-relaxed">
              {back}
            </Markdown>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons (shown after flip) */}
      {isFlipped && !rated && onRate && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <RatingButton label="Again" shortcut="1" color="red" onClick={() => handleRate('again')} />
          <RatingButton label="Hard" shortcut="2" color="amber" onClick={() => handleRate('hard')} />
          <RatingButton label="Good" shortcut="3" color="green" onClick={() => handleRate('good')} />
          <RatingButton label="Easy" shortcut="4" color="blue" onClick={() => handleRate('easy')} />
        </motion.div>
      )}

      {rated && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-green-600"
        >
          Rated! This card has been scheduled for review.
        </motion.p>
      )}
    </div>
  )
})

function RatingButton({
  label,
  shortcut,
  color,
  onClick,
}: {
  label: string
  shortcut: string
  color: 'red' | 'amber' | 'green' | 'blue'
  onClick: () => void
}) {
  const colorClasses: Record<string, string> = {
    red: 'border-red-200 text-red-700 hover:bg-red-50',
    amber: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    green: 'border-green-200 text-green-700 hover:bg-green-50',
    blue: 'border-blue-200 text-blue-700 hover:bg-blue-50',
  }

  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
        colorClasses[color],
      )}
    >
      <span className="text-[10px] opacity-50">{shortcut}</span>
      {label}
    </button>
  )
}

export { TeachFlashcard }
