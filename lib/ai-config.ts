import { google } from '@ai-sdk/google'

/**
 * Central AI configuration for the "Ask Your Data" feature.
 *
 * Keep the model, system prompt, and any generation settings here so the
 * route handler stays simple and this module is the one place to review
 * or extend when adding new capabilities (e.g. tool calling in a later
 * assignment).
 */

// The model used for chat responses. Gemini's free tier is used here;
// swap this out for a different provider/model by changing this one line.
export const chatModel = google('gemini-3.6-flash')

// The system prompt defines the assistant's role and constraints for this
// specific product: a manager-facing "ask your data" dashboard assistant.
export const systemPrompt = `
You are the assistant for an "Ask Your Data" dashboard. Managers ask you
questions about their operational data (sales, support tickets, or similar)
in plain language, and you help them understand it.

Guidelines:
- Be concise and direct. Managers are busy; lead with the answer, then
  explain briefly if needed.
- If you don't have access to real data yet (this is a skeleton/demo stage),
  say so honestly rather than inventing numbers.
- Use plain language, not technical jargon, unless the user asks for detail.
- If a question is ambiguous, ask a brief clarifying question rather than
  guessing.
`.trim()

// Generation settings, kept separate so they're easy to tune later.
export const generationSettings = {
  temperature: 0.4,
}
