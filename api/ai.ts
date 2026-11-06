/**
 * Serverless AI proxy (Vercel-style `api/` route).
 *
 * The browser only ever posts { system, user } here. Provider credentials stay
 * in server-side environment variables, so no API key reaches the client.
 * Vite dev uses the equivalent middleware in vite.config.ts.
 */

type AIRequest = {
  method?: string
  body?: unknown
}

type AIResponse = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (body: string) => void
}

const MAX_INPUT = 60_000

function send(res: AIResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default async function handler(req: AIRequest, res: AIResponse) {
  if (req.method !== 'POST') {
    send(res, 405, { error: 'method_not_allowed' })
    return
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    send(res, 503, { error: 'no_key' })
    return
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as
      | { system?: unknown; user?: unknown }
      | undefined
    const system = typeof body?.system === 'string' ? body.system : ''
    const user = typeof body?.user === 'string' ? body.user : ''
    if (!user || system.length + user.length > MAX_INPUT) {
      send(res, 400, { error: 'invalid_request' })
      return
    }

    const baseUrl = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
    const model = process.env.AI_MODEL || 'gpt-4o-mini'

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[]
      error?: { message?: string }
    }

    if (!upstream.ok) {
      send(res, 502, { error: 'upstream', detail: data?.error?.message ?? 'failed' })
      return
    }

    send(res, 200, { text: data.choices?.[0]?.message?.content ?? '' })
  } catch (error) {
    send(res, 500, { error: String(error) })
  }
}
