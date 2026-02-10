'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UndoAction {
  id: string
  action: string
  timestamp: Date
}

interface PresetCommand {
  id: string
  label: string
  command: string
}

const PRESET_COMMANDS: PresetCommand[] = [
  { id: 'list', label: 'List Downloads', command: 'list my downloads' },
  { id: 'organize-type', label: 'Organize by Type', command: 'organize downloads by type' },
  { id: 'organize-date', label: 'Organize by Date', command: 'organize downloads by date' },
  { id: 'large-files', label: 'Find Large Files', command: 'find large files' },
  { id: 'find-pdf', label: 'Find PDFs', command: 'find PDF files' },
  { id: 'find-images', label: 'Find Images', command: 'find image files' },
  { id: 'move-docs', label: 'Move to Documents', command: 'move documents to Documents folder' },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [undoHistory, setUndoHistory] = useState<UndoAction[]>([])
  const [undoLoading, setUndoLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle click outside dropdown
  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleSelectCommand = (command: string) => {
    setInput(command)
    setShowDropdown(false)
    // Submit the command after state update
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }))
      }
    }, 0)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userInput = input
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Connect to SSE stream
      const response = await fetch('/api/agent-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      let streamId = Date.now().toString()
      let hasOrganization = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'thinking') {
                assistantMessage = `💭 ${data.content}`
              } else if (data.type === 'tool_start') {
                assistantMessage += `\n🔧 Executing: ${data.tool}`
                if (data.tool === 'move_file' || data.tool === 'create_folder') {
                  hasOrganization = true
                }
              } else if (data.type === 'tool_result') {
                assistantMessage += `\n✅ ${data.tool} completed`
              } else if (data.type === 'text') {
                assistantMessage += `\n${data.content}`
              }

              setMessages((prev) => {
                const lastMessage = prev[prev.length - 1]
                if (lastMessage?.role === 'assistant' && lastMessage.id === streamId) {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: assistantMessage },
                  ]
                } else {
                  return [
                    ...prev,
                    {
                      id: streamId,
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date(),
                    },
                  ]
                }
              })
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Add to undo history if this was an organization action
      if (hasOrganization) {
        setUndoHistory((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            action: userInput,
            timestamp: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async () => {
    if (undoHistory.length === 0) return

    setUndoLoading(true)
    const lastAction = undoHistory[undoHistory.length - 1]

    try {
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: lastAction.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to undo')
      }

      // Remove from history
      setUndoHistory((prev) => prev.slice(0, -1))

      // Add message about undo
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Undo complete!\n\nReverted: "${lastAction.action}"`,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Undo error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ Undo failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setUndoLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">File Organizer</h1>
            <p className="text-sm text-gray-600">Organize your files with natural language commands</p>
          </div>
          <button
            onClick={handleUndo}
            disabled={undoHistory.length === 0 || undoLoading}
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:bg-gray-300"
            title={undoHistory.length === 0 ? 'No actions to undo' : 'Undo last organization'}
          >
            {undoLoading ? '⏳ Undoing...' : '↶ Undo Last'}
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Welcome to File Organizer</p>
              <p className="mt-2 text-gray-600">Try: "list my downloads" or "organize downloads by type"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-4 py-2 shadow">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce bg-gray-400" />
                    <div className="animation-delay h-2 w-2 animate-bounce bg-gray-400" />
                    <div className="animation-delay h-2 w-2 animate-bounce bg-gray-400" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <footer className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="relative" ref={dropdownRef}>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Type a command... (e.g., 'list downloads')"
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              {PRESET_COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleSelectCommand(cmd.command)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-700 hover:text-blue-600 focus:outline-2 focus:outline-offset-0 focus:outline-blue-500 active:bg-blue-100 transition-colors"
                >
                  <div className="font-medium">{cmd.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cmd.command}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
