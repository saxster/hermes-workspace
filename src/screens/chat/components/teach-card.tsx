import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  BookOpen01Icon,
  BulbIcon,
  Copy01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { Markdown } from '@/components/prompt-kit/markdown'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { TeachFlashcard } from './teach-flashcard'
import { cn } from '@/lib/utils'

export type TeachCardData = {
  type: 'teach_card'
  topic: string
  domain?: string
  summary?: string
  plain_language_definition?: string
  why_it_matters?: string
  definition?: string
  key_points?: Array<string>
  analogy?: string
  formula?: string
  etymology?: string
  translation?: string
  code_example?: string
  example?: string
  context?: string
  related_concepts?: Array<string>
  prior_knowledge?: Array<string>
  common_misconceptions?: Array<string>
  flashcard?: {
    front: string
    back: string
  }
}

type TeachCardProps = {
  data: TeachCardData
  className?: string
  /** Called when user clicks a related concept chip — parent should send "/teach [concept]" */
  onTeachConcept?: (concept: string) => void
}

const DOMAIN_LABELS: Record<string, { label: string; color: string }> = {
  math: { label: 'Mathematics', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' },
  cs: { label: 'Computer Science', color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800' },
  science: { label: 'Science', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' },
  history: { label: 'History', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
  literature: { label: 'Literature', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800' },
  language: { label: 'Language', color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800' },
  philosophy: { label: 'Philosophy', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' },
  economics: { label: 'Economics', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
  art: { label: 'Art & Design', color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700' },
}

function DomainBadge({ domain }: { domain?: string }) {
  const key = domain?.toLowerCase().split('/')[0] ?? 'general'
  const config = DOMAIN_LABELS[key] ?? DOMAIN_LABELS.general!
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        config.color,
      )}
    >
      {config.label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-primary-500 hover:bg-primary-100 hover:text-primary-700 transition-colors"
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Copy01Icon}
        size={12}
        strokeWidth={1.5}
      />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const TeachCard = memo(function TeachCard({ data, className, onTeachConcept }: TeachCardProps) {
  const [showFlashcard, setShowFlashcard] = useState(false)

  const hasFormula = data.formula && data.formula.trim().length > 0
  const hasEtymology = data.etymology && data.etymology.trim().length > 0
  const hasTranslation = data.translation && data.translation.trim().length > 0
  const hasCodeExample = data.code_example && data.code_example.trim().length > 0
  const hasExample = data.example && data.example.trim().length > 0
  const hasContext = data.context && data.context.trim().length > 0
  const hasMisconceptions = data.common_misconceptions && data.common_misconceptions.length > 0
  const hasPriorKnowledge = data.prior_knowledge && data.prior_knowledge.length > 0
  const hasRelated = data.related_concepts && data.related_concepts.length > 0
  const hasFlashcard = data.flashcard?.front && data.flashcard?.back

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'w-full overflow-hidden rounded-xl border',
        'bg-gradient-to-b from-primary-50/80 to-primary-50/20 dark:from-primary-900/30 dark:to-primary-950/20',
        'border-primary-200 dark:border-primary-700',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-primary-100 px-4 py-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={BookOpen01Icon}
              size={18}
              strokeWidth={1.5}
              className="text-primary-500 shrink-0"
            />
            <h3 className="text-base font-semibold text-primary-950 truncate">
              {data.topic}
            </h3>
          </div>
          <DomainBadge domain={data.domain} />
        </div>
        {hasFlashcard && (
          <Button
            variant="ghost"
            className="shrink-0 gap-1.5 text-xs text-primary-600 hover:text-primary-900"
            onClick={() => setShowFlashcard(!showFlashcard)}
          >
            <HugeiconsIcon icon={BulbIcon} size={14} strokeWidth={1.5} />
            {showFlashcard ? 'Hide Card' : 'Flashcard'}
          </Button>
        )}
      </div>

      {/* Flashcard overlay */}
      <AnimatePresence>
        {showFlashcard && hasFlashcard && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-primary-100"
          >
            <div className="p-4">
              <TeachFlashcard
                front={data.flashcard!.front}
                back={data.flashcard!.back}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prior knowledge bridge */}
      {hasPriorKnowledge && (
        <div className="border-b border-primary-100 dark:border-primary-800 bg-blue-50/50 dark:bg-blue-900/20 px-4 py-2">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <span className="font-medium">Building on: </span>
            {data.prior_knowledge!.join(' · ')}
          </p>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 py-3">
        {/* Plain-language definition (Feynman-required) */}
        {data.plain_language_definition && (
          <div>
            <Markdown className="text-base font-medium text-primary-900 dark:text-primary-100 leading-relaxed">
              {data.plain_language_definition}
            </Markdown>
          </div>
        )}

        {/* Why it matters (the hook) */}
        {data.why_it_matters && (
          <div className="rounded-lg border-l-2 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Why it matters
            </p>
            <Markdown className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
              {data.why_it_matters}
            </Markdown>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div>
            <Markdown className="text-sm text-primary-800 leading-relaxed">
              {data.summary}
            </Markdown>
          </div>
        )}

        {/* Definition */}
        {data.definition && (
          <div className="rounded-lg border border-primary-200 dark:border-primary-700 bg-white/60 dark:bg-white/5 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
              Definition
            </p>
            <Markdown className="text-sm text-primary-900 leading-relaxed">
              {data.definition}
            </Markdown>
          </div>
        )}

        {/* Key Points */}
        {data.key_points && data.key_points.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
              Key Points
            </p>
            <ul className="flex flex-col gap-1">
              {data.key_points.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-primary-800"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary-400" />
                  <Markdown className="leading-relaxed">{point}</Markdown>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analogy */}
        {data.analogy && (
          <div className="rounded-lg border-l-2 border-amber-400 bg-amber-50/50 dark:bg-amber-900/20 px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Analogy
            </p>
            <Markdown className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              {data.analogy}
            </Markdown>
          </div>
        )}

        {/* Formula */}
        {hasFormula && (
          <div className="rounded-lg border border-primary-200 dark:border-primary-700 bg-white/60 dark:bg-white/5 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">
                Formula
              </p>
              <CopyButton text={data.formula!} />
            </div>
            <div className="mt-1">
              <Markdown>{`$$${data.formula}$$`}</Markdown>
            </div>
          </div>
        )}

        {/* Etymology */}
        {hasEtymology && (
          <div className="rounded-lg border-l-2 border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/20 px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Etymology
            </p>
            <Markdown className="text-sm text-cyan-900 dark:text-cyan-200 leading-relaxed">
              {data.etymology!}
            </Markdown>
          </div>
        )}

        {/* Translation */}
        {hasTranslation && (
          <div className="rounded-lg border-l-2 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Translation
            </p>
            <Markdown className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
              {data.translation!}
            </Markdown>
          </div>
        )}

        {/* Code Example */}
        {hasCodeExample && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
              Code Example
            </p>
            <Markdown>{data.code_example!}</Markdown>
          </div>
        )}

        {/* Worked Example */}
        {hasExample && (
          <div className="rounded-lg border border-primary-200 dark:border-primary-700 bg-white/60 dark:bg-white/5 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
              Example
            </p>
            <Markdown className="text-sm text-primary-800 leading-relaxed">
              {data.example!}
            </Markdown>
          </div>
        )}

        {/* Context */}
        {hasContext && (
          <div className="rounded-lg border-l-2 border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 px-3 py-2">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Context
            </p>
            <Markdown className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
              {data.context!}
            </Markdown>
          </div>
        )}

        {/* Common Misconceptions */}
        {hasMisconceptions && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="w-fit gap-1.5 text-xs text-primary-500 hover:text-primary-700">
              <span>Common Misconceptions</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={1.5}
                className="transition-transform duration-150 group-data-panel-open:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <ul className="mt-1.5 flex flex-col gap-1">
                {data.common_misconceptions!.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-red-700"
                  >
                    <span className="mt-0.5 shrink-0 text-red-400">✗</span>
                    <Markdown className="leading-relaxed">{item}</Markdown>
                  </li>
                ))}
              </ul>
            </CollapsiblePanel>
          </Collapsible>
        )}
      </div>

      {/* Footer — Related Concepts */}
      {hasRelated && (
        <div className="border-t border-primary-100 px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-400">
            Related Concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.related_concepts!.map((concept) => (
              <button
                key={concept}
                onClick={() => onTeachConcept?.(concept)}
                className={cn(
                  'inline-flex items-center rounded-full border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-800/40 px-2.5 py-0.5 text-xs text-primary-700 dark:text-primary-300 transition-colors',
                  onTeachConcept
                    ? 'cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-700 hover:border-primary-300'
                    : 'cursor-default hover:bg-primary-100 dark:hover:bg-primary-800',
                )}
              >
                {concept}
                {onTeachConcept && (
                  <span className="ml-1 text-[10px] text-primary-400">→</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
})

/**
 * Find balanced JSON starting from an opening brace, handling nested braces.
 * Returns the JSON substring or null if no balanced block found.
 */
function findBalancedJson(text: string, startIndex: number): string | null {
  if (text[startIndex] !== '{') return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]!

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') depth++
    if (char === '}') {
      depth--
      if (depth === 0) {
        return text.slice(startIndex, i + 1)
      }
    }
  }

  return null
}

/**
 * Attempt to parse a teach card JSON block from assistant text.
 * Returns the parsed data if found, null otherwise.
 *
 * Uses balanced brace matching instead of regex to handle nested
 * objects, arrays, and escaped content correctly.
 */
export function extractTeachCard(text: string): TeachCardData | null {
  // Strategy 1: Fenced code block — extract content between ```json and ```
  const fenceStart = text.search(/```(?:json)?\s*\n\s*\{/)
  if (fenceStart !== -1) {
    const jsonStart = text.indexOf('{', fenceStart)
    if (jsonStart !== -1) {
      const jsonBlock = findBalancedJson(text, jsonStart)
      if (jsonBlock) {
        try {
          const parsed = JSON.parse(jsonBlock)
          if (parsed?.type === 'teach_card') return parsed as TeachCardData
        } catch {
          // Malformed JSON inside fence, fall through
        }
      }
    }
  }

  // Strategy 2: Scan for any { that precedes "type":"teach_card"
  const marker = '"teach_card"'
  let searchFrom = 0
  while (searchFrom < text.length) {
    const markerIndex = text.indexOf(marker, searchFrom)
    if (markerIndex === -1) break

    // Walk backwards to find the opening brace
    let braceIndex = -1
    for (let i = markerIndex - 1; i >= 0; i--) {
      if (text[i] === '{') {
        braceIndex = i
        break
      }
    }

    if (braceIndex !== -1) {
      const jsonBlock = findBalancedJson(text, braceIndex)
      if (jsonBlock) {
        try {
          const parsed = JSON.parse(jsonBlock)
          if (parsed?.type === 'teach_card') return parsed as TeachCardData
        } catch {
          // Not valid JSON at this location, keep scanning
        }
      }
    }

    searchFrom = markerIndex + marker.length
  }

  return null
}

/**
 * Strips the teach card JSON from the message text, returning
 * the remaining text (if any) to render as normal markdown.
 */
export function stripTeachCardJson(text: string): string {
  // Try fenced block removal first
  const fenceStart = text.search(/```(?:json)?\s*\n\s*\{/)
  if (fenceStart !== -1) {
    const jsonStart = text.indexOf('{', fenceStart)
    if (jsonStart !== -1) {
      const jsonBlock = findBalancedJson(text, jsonStart)
      if (jsonBlock) {
        try {
          const parsed = JSON.parse(jsonBlock)
          if (parsed?.type === 'teach_card') {
            // Remove the entire fenced block including the ``` markers
            const fenceEnd = text.indexOf('```', jsonStart + jsonBlock.length)
            const endIndex = fenceEnd !== -1 ? fenceEnd + 3 : jsonStart + jsonBlock.length
            return (text.slice(0, fenceStart) + text.slice(endIndex)).trim()
          }
        } catch {
          // Not a teach card, leave text as-is
        }
      }
    }
  }

  // Try raw JSON removal
  const marker = '"teach_card"'
  const markerIndex = text.lastIndexOf(marker)
  if (markerIndex !== -1) {
    for (let i = markerIndex - 1; i >= 0; i--) {
      if (text[i] === '{') {
        const jsonBlock = findBalancedJson(text, i)
        if (jsonBlock) {
          try {
            const parsed = JSON.parse(jsonBlock)
            if (parsed?.type === 'teach_card') {
              return (text.slice(0, i) + text.slice(i + jsonBlock.length)).trim()
            }
          } catch {
            // Not valid, continue
          }
        }
        break
      }
    }
  }

  return text
}

export { TeachCard }
