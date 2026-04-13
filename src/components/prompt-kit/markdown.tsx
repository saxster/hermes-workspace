import { createContext, memo, useContext, useId, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { CodeBlock } from './code-block'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

function extractLanguage(className?: string): string {
  if (!className) return 'text'
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : 'text'
}

type TableRenderContextValue = {
  headersRef: React.MutableRefObject<Array<string>>
  columnIndexRef: React.MutableRefObject<number>
  collectingHeaderRef: React.MutableRefObject<boolean>
}

const TableRenderContext = createContext<TableRenderContextValue | null>(null)

function useTableRenderContext() {
  return useContext(TableRenderContext)
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map((item: React.ReactNode) => textFromNode(item)).join('')
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props: { children?: React.ReactNode } }
    return textFromNode(element.props.children)
  }
  return ''
}

function slugifyHeading(children: React.ReactNode): string {
  const raw = textFromNode(children)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
  return raw.length > 0 ? raw : 'section'
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children }) {
    const isInline = !className?.includes('language-')

    if (isInline) {
      return (
        <code className="rounded bg-primary-100 px-1.5 py-0.5 text-[0.9em] font-mono text-primary-900 border border-primary-200">
          {children}
        </code>
      )
    }

    const language = extractLanguage(className)
    return (
      <CodeBlock
        content={String(children ?? '')}
        language={language}
        className="w-full my-4"
      />
    )
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
  h1: function H1Component({ children }) {
    return (
      <h1 className="mt-8 mb-4 text-3xl leading-tight font-semibold text-primary-950 text-balance first:mt-0">
        {children}
      </h1>
    )
  },
  h2: function H2Component({ children }) {
    const id = slugifyHeading(children)
    return (
      <h2
        id={id}
        className="mt-8 mb-4 text-2xl leading-tight font-semibold text-primary-950 text-balance first:mt-0 border-b border-primary-100 pb-2"
      >
        <a
          href={`#${id}`}
          className="group/heading inline-flex items-center gap-1 no-underline"
        >
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="text-primary-500 opacity-0 transition-opacity group-hover/heading:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
    )
  },
  h3: function H3Component({ children }) {
    const id = slugifyHeading(children)
    return (
      <h3
        id={id}
        className="mt-6 mb-3 text-xl leading-tight font-semibold text-primary-950 text-balance first:mt-0"
      >
        <a
          href={`#${id}`}
          className="group/heading inline-flex items-center gap-1 no-underline"
        >
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="text-primary-500 opacity-0 transition-opacity group-hover/heading:opacity-100"
          >
            #
          </span>
        </a>
      </h3>
    )
  },
  h4: function H4Component({ children }) {
    return (
      <h4 className="mt-6 mb-3 text-lg leading-tight font-semibold text-primary-950 text-balance first:mt-0">
        {children}
      </h4>
    )
  },
  h5: function H5Component({ children }) {
    return (
      <h5 className="mt-4 mb-2 text-base leading-tight font-semibold text-primary-950 text-balance first:mt-0">
        {children}
      </h5>
    )
  },
  h6: function H6Component({ children }) {
    return (
      <h6 className="mt-4 mb-2 text-base leading-tight font-semibold text-primary-900 text-balance first:mt-0">
        {children}
      </h6>
    )
  },
  p: function PComponent({ children }) {
    return (
      <p className="mb-4 last:mb-0 text-primary-950 text-pretty leading-relaxed">
        {children}
      </p>
    )
  },
  ul: function UlComponent({ children }) {
    return (
      <ul className="mb-4 ml-6 list-disc text-primary-950 marker:text-primary-400 space-y-1">
        {children}
      </ul>
    )
  },
  ol: function OlComponent({ children }) {
    return (
      <ol className="mb-4 ml-6 list-decimal text-primary-950 marker:text-primary-500 space-y-1">
        {children}
      </ol>
    )
  },
  li: function LiComponent({ children }) {
    return <li className="leading-relaxed pl-1">{children}</li>
  },
  a: function AComponent({ children, href }) {
    return (
      <a
        href={href}
        className="text-primary-950 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-950 hover:decoration-primary-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  },
  blockquote: function BlockquoteComponent({ children }) {
    return (
      <blockquote className="my-6 border-l-4 border-primary-300 pl-4 py-1 text-primary-900 italic bg-primary-50/50 rounded-r-lg">
        {children}
      </blockquote>
    )
  },
  strong: function StrongComponent({ children }) {
    return <strong className="font-semibold text-primary-950">{children}</strong>
  },
  em: function EmComponent({ children }) {
    return <em className="italic text-primary-950">{children}</em>
  },
  hr: function HrComponent() {
    return <hr className="my-8 border-primary-200" />
  },
  table: function TableComponent({ children }) {
    const headersRef = useRef<Array<string>>([])
    const columnIndexRef = useRef(0)
    const collectingHeaderRef = useRef(false)
    return (
      <TableRenderContext.Provider
        value={{ headersRef, columnIndexRef, collectingHeaderRef }}
      >
        <div className="my-6 max-w-full overflow-x-auto rounded-xl border border-primary-200 bg-primary-50/20 shadow-sm">
          <table className="w-full min-w-max border-collapse text-sm sm:min-w-full tabular-nums">
            {children}
          </table>
        </div>
      </TableRenderContext.Provider>
    )
  },
  thead: function TheadComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.collectingHeaderRef.current = true
      context.columnIndexRef.current = 0
      context.headersRef.current = []
    }
    return (
      <thead className="sticky top-0 z-10 border-b border-primary-200 bg-primary-100/95 backdrop-blur-sm max-sm:hidden">
        {children}
      </thead>
    )
  },
  tbody: function TbodyComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.collectingHeaderRef.current = false
      context.columnIndexRef.current = 0
    }
    return (
      <tbody className="divide-y divide-primary-100 max-sm:block max-sm:divide-y-0">
        {children}
      </tbody>
    )
  },
  tr: function TrComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.columnIndexRef.current = 0
    }
    return (
      <tr className="odd:bg-primary-50/60 even:bg-white transition-colors hover:bg-primary-100/45 max-sm:mb-3 max-sm:block max-sm:overflow-hidden max-sm:rounded-lg max-sm:border max-sm:border-primary-200 max-sm:bg-primary-50">
        {children}
      </tr>
    )
  },
  th: function ThComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      const index = context.columnIndexRef.current
      context.columnIndexRef.current += 1
      if (context.collectingHeaderRef.current) {
        context.headersRef.current[index] = textFromNode(children).trim()
      }
    }
    return (
      <th className="px-4 py-3 text-left font-semibold text-primary-950 whitespace-nowrap">
        {children}
      </th>
    )
  },
  td: function TdComponent({ children }) {
    const context = useTableRenderContext()
    let label = ''
    if (context) {
      const index = context.columnIndexRef.current
      context.columnIndexRef.current += 1
      label = context.headersRef.current[index] ?? `Column ${index + 1}`
    }
    return (
      <td
        data-label={label}
        className="px-4 py-3 text-primary-950 align-top max-sm:grid max-sm:grid-cols-[minmax(0,9rem)_1fr] max-sm:gap-3 max-sm:border-b max-sm:border-primary-100 max-sm:px-3 max-sm:py-2 max-sm:last:border-b-0 max-sm:before:content-[attr(data-label)] max-sm:before:text-xs max-sm:before:font-medium max-sm:before:text-primary-700"
      >
        {children}
      </td>
    )
  },
  tfoot: function TfootComponent({ children }) {
    return (
      <tfoot className="border-t border-primary-200 bg-primary-100/40">
        {children}
      </tfoot>
    )
  },
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  },
)

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock'

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId

  return (
    <div
      id={blockId}
      className={cn(
        'flex flex-col gap-0 break-words overflow-hidden',
        className,
      )}
    >
      <MemoizedMarkdownBlock content={children} components={components} />
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = 'Markdown'

export { Markdown }


const Markdown = memo(MarkdownComponent)
Markdown.displayName = 'Markdown'

export { Markdown }
