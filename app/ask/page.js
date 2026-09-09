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

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  const text = Array.isArray(message.parts)
    ? message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('')
    : ''

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${
          isUser
            ? 'border-transparent bg-[var(--color-brand-600)] text-white'
            : 'border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)]'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">{text}</p>
      </div>
    </div>
  )
}

export default function AskPage() {
  // v7 useChat no longer manages the text input for you — own it yourself.
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, stop, error } = useChat({
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
                Ask a question to start the conversation.
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
              <p className="mt-3 text-sm text-red-600">
                The conversation could not be completed. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}