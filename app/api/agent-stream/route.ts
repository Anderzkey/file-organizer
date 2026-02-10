import { mockAgentStream } from '@/lib/mock-agent'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream events from mock agent
          for await (const event of mockAgentStream(message)) {
            const data = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(new TextEncoder().encode(data))
          }
        } catch (error) {
          const errorEvent = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          const data = `data: ${JSON.stringify(errorEvent)}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Agent stream error:', error)
    return new Response(JSON.stringify({ error: 'Stream error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
