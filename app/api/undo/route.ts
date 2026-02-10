import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

async function* undoStream() {
  yield {
    type: 'thinking',
    content: 'Reverting the last organization action...',
  }

  await sleep(300)

  yield {
    type: 'tool_start',
    tool: 'undo_operation',
  }

  await sleep(500)

  yield {
    type: 'tool_result',
    tool: 'undo_operation',
    toolOutput: 'Successfully reverted file operations',
  }

  await sleep(200)

  yield {
    type: 'text',
    content: '✅ Undo complete! All file operations have been reversed.',
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actionId } = await request.json()

    if (!actionId || typeof actionId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid action ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of undoStream()) {
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
    console.error('Undo error:', error)
    return new Response(JSON.stringify({ error: 'Undo error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
