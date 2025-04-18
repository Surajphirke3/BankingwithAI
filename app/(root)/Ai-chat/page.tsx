'use client'

import { useState, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini API with proper environment variable
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

// Model configuration
const MODEL_NAME = 'gemini-2.5-pro-exp-03-25'
const GENERATION_CONFIG = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536,
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chat, setChat] = useState<any>(null)

  useEffect(() => {
    // Initialize chat session with the specified model
    const initChat = async () => {
      try {
        if (!API_KEY) {
          throw new Error('API key is not configured. Please add your Gemini API key to .env.local file.')
        }
        if (!genAI) {
          throw new Error('Failed to initialize Gemini AI.')
        }

        const model = genAI.getGenerativeModel({ 
          model: MODEL_NAME,
          generationConfig: GENERATION_CONFIG,
        })

        const chatSession = model.startChat({
          generationConfig: GENERATION_CONFIG,
          history: [],
        })

        setChat(chatSession)
        setError(null)
        return true
      } catch (error) {
        console.error('Error initializing chat:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat'
        setError(errorMessage)
        return false
      }
    }

    const init = async () => {
      const success = await initChat()
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: success
          ? "Hello! I'm your AI banking assistant . How can I help you today?"
          : "⚠️ Configuration Error: Please make sure to:\n1. Create a .env.local file\n2. Add NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here\n3. Restart the development server",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }

    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Validate configuration
    if (!API_KEY || !genAI || !chat) {
      setError('Chat is not properly initialized. Please check your API key configuration.')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const result = await chat.sendMessage(input.trim())
      const response = await result.response
      const text = response.text()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`w-full ${error ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
          <div className="max-w-[1920px] mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">AI Banking Assistant</h1>
                <p className="text-sm text-white/90 mt-1">
                  {error ? 'Configuration Error' : 'Powered by Nextus'}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 w-full bg-gray-50">
          <div className="max-w-[1920px] mx-auto h-full">
            <div className="h-[calc(100vh-180px)] overflow-y-auto px-4 py-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 transition-all duration-300 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                        : error && message.content.includes('⚠️')
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                    {message.timestamp && (
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' 
                          ? 'text-blue-100' 
                          : error && message.content.includes('⚠️')
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="w-full border-t border-gray-200 bg-white">
          <div className="max-w-[1920px] mx-auto px-4 py-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder={error ? "Please configure API key first..." : "Type your message..."}
                disabled={isLoading || !!error}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || !!error}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  error
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    : isLoading
                    ? 'bg-gray-400 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
