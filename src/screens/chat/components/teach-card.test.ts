import { describe, expect, it } from 'vitest'
import { extractTeachCard, stripTeachCardJson } from './teach-card'

describe('extractTeachCard', () => {
  it('extracts a teach card from a fenced JSON code block', () => {
    const text = `Here's what I found:

\`\`\`json
{"type":"teach_card","topic":"Eigenvalue","domain":"math","summary":"A scalar that...","key_points":["Point 1"]}
\`\`\`
`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.topic).toBe('Eigenvalue')
    expect(result!.domain).toBe('math')
  })

  it('extracts a teach card from raw JSON at end of message', () => {
    const text = `Let me explain this concept.

{"type":"teach_card","topic":"Recursion","domain":"cs","summary":"A function calling itself"}`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.topic).toBe('Recursion')
  })

  it('handles nested objects and arrays correctly', () => {
    const card = {
      type: 'teach_card',
      topic: 'French Revolution',
      domain: 'history',
      key_points: ['Caused by inequality', 'Started in 1789'],
      flashcard: { front: 'When did it start?', back: '1789' },
      related_concepts: ['Enlightenment', 'Napoleon'],
    }
    const text = `Here's the card:\n${JSON.stringify(card)}`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.key_points).toHaveLength(2)
    expect(result!.flashcard?.front).toBe('When did it start?')
    expect(result!.related_concepts).toContain('Napoleon')
  })

  it('handles JSON with escaped quotes in strings', () => {
    const text = `{"type":"teach_card","topic":"Strings","summary":"A \\"string\\" is a sequence of characters"}`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.summary).toContain('"string"')
  })

  it('returns null when no teach card is present', () => {
    const text = 'Just a normal response with no JSON at all.'
    expect(extractTeachCard(text)).toBeNull()
  })

  it('returns null for JSON that is not a teach card', () => {
    const text = '{"type":"other","data":"something"}'
    expect(extractTeachCard(text)).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    const text = '{"type":"teach_card","topic":"Bad JSON",'
    expect(extractTeachCard(text)).toBeNull()
  })

  it('handles a teach card embedded in markdown with surrounding text', () => {
    const card = { type: 'teach_card', topic: 'Saudade', domain: 'language', summary: 'A Portuguese word' }
    const text = `# Explanation\n\nHere is the structured card:\n\n${JSON.stringify(card)}\n\nHope that helps!`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.topic).toBe('Saudade')
  })

  it('extracts from a fenced block without json language hint', () => {
    const text = "```\n{\"type\":\"teach_card\",\"topic\":\"Test\"}\n```"
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.topic).toBe('Test')
  })

  it('prefers the teach_card JSON even with other JSON in text', () => {
    const text = `Config: {"model":"gpt-4"}\n\n{"type":"teach_card","topic":"Priority"}`
    const result = extractTeachCard(text)
    expect(result).not.toBeNull()
    expect(result!.topic).toBe('Priority')
  })
})

describe('stripTeachCardJson', () => {
  it('removes a fenced JSON code block', () => {
    const text = `Some intro text.\n\n\`\`\`json\n{"type":"teach_card","topic":"X"}\n\`\`\`\n\nSome outro.`
    const result = stripTeachCardJson(text)
    expect(result).toContain('Some intro text.')
    expect(result).toContain('Some outro.')
    expect(result).not.toContain('teach_card')
  })

  it('removes raw JSON at the end of text', () => {
    const text = `Here is the explanation.\n\n{"type":"teach_card","topic":"Y"}`
    const result = stripTeachCardJson(text)
    expect(result).toBe('Here is the explanation.')
  })

  it('returns original text when no teach card present', () => {
    const text = 'Just normal text with no cards.'
    expect(stripTeachCardJson(text)).toBe(text)
  })

  it('handles nested JSON correctly when stripping', () => {
    const card = { type: 'teach_card', topic: 'Nested', flashcard: { front: 'Q', back: 'A' } }
    const text = `Intro.\n${JSON.stringify(card)}`
    const result = stripTeachCardJson(text)
    expect(result).toBe('Intro.')
    expect(result).not.toContain('teach_card')
  })
})
