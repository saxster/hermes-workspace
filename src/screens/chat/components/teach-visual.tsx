import { memo, useState } from 'react'
import { motion } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type TeachVisualProps = {
  /** URL to an Excalidraw diagram (excalidraw.com link or local file) */
  url?: string
  /** Raw Excalidraw JSON content for inline rendering */
  json?: string
  /** Caption or description of the diagram */
  caption?: string
  className?: string
}

/**
 * Embeds an Excalidraw diagram with preview and "Open in Excalidraw" link.
 *
 * Supports two modes:
 * 1. URL mode: Renders an iframe pointing to the Excalidraw URL
 * 2. JSON mode: Renders a preview with a link to open in Excalidraw
 */
const TeachVisual = memo(function TeachVisual({
  url,
  json,
  caption,
  className,
}: TeachVisualProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasUrl = url && url.trim().length > 0
  const hasJson = json && json.trim().length > 0

  if (!hasUrl && !hasJson) return null

  const excalidrawEditUrl = hasUrl
    ? url
    : `https://excalidraw.com/#json=${encodeURIComponent(json!)}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'overflow-hidden rounded-xl border border-primary-200 bg-white',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">📐</span>
          <span className="text-xs font-medium text-primary-700">
            {caption || 'Visual Explanation'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={excalidrawEditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600 hover:bg-primary-100 transition-colors"
          >
            Open in Excalidraw ↗
          </a>
          {hasUrl && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center rounded-md p-1 text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors"
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={1.5}
                className={cn(
                  'transition-transform duration-150',
                  isExpanded && 'rotate-180',
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Embedded preview */}
      {hasUrl && (
        <Collapsible defaultOpen={true}>
          <CollapsiblePanel>
            <div className="relative aspect-[16/9] w-full bg-white">
              <iframe
                src={url}
                title={caption || 'Excalidraw diagram'}
                className="absolute inset-0 size-full border-0"
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
              />
            </div>
          </CollapsiblePanel>
        </Collapsible>
      )}

      {/* JSON preview (no iframe, just a placeholder with file info) */}
      {!hasUrl && hasJson && (
        <div className="flex items-center justify-center bg-primary-50/50 px-4 py-6">
          <div className="text-center">
            <p className="text-2xl mb-1">🎨</p>
            <p className="text-xs text-primary-600">
              Excalidraw diagram generated
            </p>
            <p className="text-[10px] text-primary-400 mt-0.5">
              Click "Open in Excalidraw" to view and edit
            </p>
          </div>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div className="border-t border-primary-100 px-3 py-1.5">
          <p className="text-[11px] text-primary-500 italic">{caption}</p>
        </div>
      )}
    </motion.div>
  )
})

/**
 * Detect Excalidraw references in message text.
 * Returns URLs found in the text that point to Excalidraw.
 */
export function extractExcalidrawUrls(text: string): Array<string> {
  const urlPattern = /https?:\/\/(?:www\.)?excalidraw\.com\/[^\s)"\]]+/g
  const matches = text.match(urlPattern)
  return matches ? [...new Set(matches)] : []
}

export { TeachVisual }
