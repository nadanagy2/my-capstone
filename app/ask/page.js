'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState } from 'react'

function ThinkingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-2 shadow-sm">
        <span className="sr-only">Assistant is thinking</span>
        <span className="flex items-center gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 rounded-full bg-[var(--color-neutral-500)] animate-bounce"
              style={{ animationDelay: `${dot * 120}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}

/**
 * Renders a sales-query tool result as a real table + summary, not raw JSON.
 * Handles both grouped (category/region) and raw daily-row shapes.
 */
function SalesResultTable({ output }) {
  const { rows, totalRevenue, totalOrders, groupedBy } = output
  const isGrouped = groupedBy !== 'none'

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-4 py-2.5">
        <span className="text-xs font-medium tracking-wide text-[var(--color-neutral-600)] uppercase">
          Sales query result{isGrouped ? ` — grouped by ${groupedBy}` : ''}
        </span>
        <span className="text-sm font-semibold text-[var(--color-neutral-900)]">
          ${totalRevenue.toLocaleString()} · {totalOrders} orders
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-neutral-200)] text-[var(--color-neutral-500)]">
              {isGrouped ? (
                <>
                  <th className="px-4 py-2 font-medium">{groupedBy === 'category' ? 'Category' : 'Region'}</th>
                  <th className="px-4 py-2 font-medium">Revenue</th>
                  <th className="px-4 py-2 font-medium">Orders</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Region</th>
                  <th className="px-4 py-2 font-medium">Revenue</th>
                  <th className="px-4 py-2 font-medium">Orders</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isGrouped ? 3 : 5} className="px-4 py-4 text-center text-[var(--color-neutral-500)]">
                  No matching data.
                </td>
              </tr>
            ) : isGrouped ? (
              rows.map((row) => (
                <tr key={row.key} className="border-b border-[var(--color-neutral-100)] last:border-0">
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.key}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">${row.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.orders}</td>
                </tr>
              ))
            ) : (
              rows.map((row) => (
                <tr key={row.date} className="border-b border-[var(--color-neutral-100)] last:border-0">
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.date}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.category}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.region}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">${row.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-[var(--color-neutral-900)]">{row.orders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Renders one tool-call part, with a visually distinct treatment for each
 * of the four lifecycle states the AI SDK reports:
 *   input-streaming  -> the model is still deciding what arguments to pass
 *   input-available  -> arguments are finalized; the tool is about to run
 *   output-available -> the tool succeeded; render the real result
 *   output-error     -> the tool failed; show a designed error, not a crash
 */
function ToolCallPart({ part }) {
  const { state, input, output, errorText } = part

  if (state === 'input-streaming') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] px-3 py-2 text-xs text-[var(--color-neutral-500)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-neutral-400)]" />
        Deciding what to look up...
      </div>
    )
  }

  if (state === 'input-available') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-3 py-2 text-xs text-[var(--color-brand-700)]">
        <span className="h-1.5 w-1.5 animate-spin rounded-full border-2 border-[var(--color-brand-400)] border-t-transparent" />
        Querying sales data
        {input?.startDate || input?.endDate ? (
          <span className="font-medium">
            ({input?.startDate ?? '…'} to {input?.endDate ?? '…'})
          </span>
        ) : null}
        {input?.category ? <span className="font-medium">— {input.category}</span> : null}
      </div>
    )
  }

  if (state === 'output-available') {
    return <SalesResultTable output={output} />
  }

  if (state === 'output-error') {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <span className="mt-0.5">⚠</span>
        <div>
          <p className="font-medium">Couldn't retrieve sales data.</p>
          <p className="mt-0.5 text-xs text-red-600">{errorText ?? 'An unexpected error occurred.'}</p>
        </div>
      </div>
    )
  }

  return null
}


/**
 * Minimal inline-markdown renderer: only handles **bold** text, since
 * that's the one markdown pattern the model reliably produces in this
 * app. Avoids pulling in a full markdown library for one feature.
 */
function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const parts = Array.isArray(message.parts) ? message.parts : []

  const textContent = parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')

  const toolParts = parts.filter((part) => part.type?.startsWith('tool-'))

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {toolParts.map((part, index) => (
        <div key={part.toolCallId ?? index} className="w-full max-w-[85%]">
          <ToolCallPart part={part} />
        </div>
      ))}

      {textContent && (
        <div
          className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
            isUser
              ? 'border-transparent bg-[var(--color-brand-600)] text-white'
              : 'border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)]'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">{renderInlineMarkdown(textContent)}</p>
        </div>
      )}
    </div>
  )
}

export default function AskPage() {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const scrollAreaRef = useRef(null)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const isBusy = status === 'submitted' || status === 'streaming'
  const lastMessage = messages[messages.length - 1]
  const isWaitingForAssistant =
    !!lastMessage && lastMessage.role === 'user' && isBusy

  const scrollToBottom = () => {
    const node = scrollAreaRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    const node = scrollAreaRef.current
    if (!node) return

    const handleScroll = () => {
      const distanceFromBottom = node.scrollHeight - (node.scrollTop + node.clientHeight)
      const nearBottom = distanceFromBottom <= 160
      setIsNearBottom(nearBottom)
      setShowJumpToLatest(!nearBottom && messages.length > 0)
    }

    handleScroll()
    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => node.removeEventListener('scroll', handleScroll)
  }, [messages.length])

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom()
    }
  }, [messages, status, isNearBottom])

  const handleFormSubmit = (event) => {
    event.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || isBusy) {
      return
    }

    sendMessage({ text: trimmed })
    setInput('')
  }

  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-2xl font-semibold text-[var(--color-neutral-900)]">Ask Your Data</h1>

        <div
          className="overflow-hidden rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)]"
          style={{ boxShadow: '0 1px 6px rgba(0, 0, 0, 0.06)' }}
        >
          <div
            ref={scrollAreaRef}
            className="max-h-[60vh] min-h-[320px] space-y-4 overflow-y-auto px-3 py-4 sm:px-5"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-4 text-sm text-[var(--color-neutral-600)]">
                Try asking: "What was our total revenue in August?" or "Show me sales grouped by category."
              </div>
            ) : (
              messages.map((message) => <MessageBubble key={message.id} message={message} />)
            )}

            {isWaitingForAssistant && <ThinkingIndicator />}
          </div>

          <div className="border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] p-3 sm:p-4">
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label htmlFor="ask-input" className="sr-only">
                  Ask a question
                </label>
                <textarea
                  id="ask-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={1}
                  placeholder="Type your question..."
                  aria-label="Ask your data"
                  disabled={isBusy}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-400)] disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-500)]"
                  style={{ maxHeight: '160px' }}
                />

                <div className="flex items-center gap-2 sm:shrink-0">
                  {isBusy && (
                    <button
                      type="button"
                      onClick={() => stop()}
                      className="rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] px-3 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] transition hover:bg-[var(--color-neutral-200)]"
                    >
                      Stop
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!input.trim() || isBusy}
                    className="rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-200)] disabled:text-[var(--color-neutral-500)]"
                  >
                    Send
                  </button>
                </div>
              </div>
            </form>

            {showJumpToLatest && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowJumpToLatest(false)
                    scrollToBottom()
                  }}
                  className="rounded-full border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] px-3 py-1.5 text-xs font-medium text-[var(--color-neutral-700)] shadow-sm transition hover:bg-[var(--color-neutral-50)]"
                >
                  Jump to latest
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <span>Something went wrong sending that message.</span>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}