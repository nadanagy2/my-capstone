import { streamText, convertToModelMessages, smoothStream } from 'ai'
import { chatModel, systemPrompt, generationSettings } from '@/lib/ai-config'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// This route handles POST requests from the client's useChat hook.
// It never exposes the API key to the browser — the key lives only in
// .env.local (server-side) and is read internally by the @ai-sdk/google
// provider when chatModel is used.

export async function POST(req) {
  const { messages } = await req.json()

  const result = streamText({
    model: chatModel,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: generationSettings.temperature,
    // Gemini can stream in large, coarse chunks. smoothStream re-buffers
    // whatever chunk size the provider sends and re-emits it word by word,
    // so the UI shows a smooth, visible stream regardless of how the
    // underlying model batches its output.
    experimental_transform: smoothStream({ delayInMs: 25, chunking: 'word' }),
  })

  return result.toUIMessageStreamResponse()
}
