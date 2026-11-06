import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import path from 'node:path'

function aiDevRoute(): Plugin {
  return {
    name: 'daily-topper-ai-route',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        const env = loadEnv(server.config.mode, process.cwd(), '')
        const key = env.OPENAI_API_KEY
        if (!key) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'no_key' }))
          return
        }
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const { system, user } = JSON.parse(raw)
          const OpenAIBase = env.AI_BASE_URL || 'https://api.openai.com/v1'
          const model = env.AI_MODEL || 'gpt-4o-mini'
          const upstream = await fetch(`${OpenAIBase}/chat/completions`, {
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
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'upstream', detail: data?.error?.message ?? 'failed' }))
            return
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ text: data.choices?.[0]?.message?.content ?? '' }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(error) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), aiDevRoute()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: { port: 5173, host: true },
})
