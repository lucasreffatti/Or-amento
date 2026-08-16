'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Sparkles, Minimize2, Maximize2, RefreshCw, Key, Check } from 'lucide-react'
import { sendAiChatMessageAction, ChatMessage } from '@/app/actions/aiChat'

export function AiAssistantChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [customKey, setCustomKey] = useState('')
  const [savedKeySuccess, setSavedKeySuccess] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou o **Assistente IA da sua Oficina**. 🚗🔧\n\nComo posso ajudar você hoje com orçamentos, estoque ou diagnósticos?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key')
    if (storedKey) setCustomKey(storedKey)
  }, [])

  const saveApiKey = (key: string) => {
    const trimmed = key.trim()
    setCustomKey(trimmed)
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed)
    } else {
      localStorage.removeItem('gemini_api_key')
    }
    setSavedKeySuccess(true)
    setTimeout(() => setSavedKeySuccess(false), 2500)
  }

  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const activeKey = customKey.trim() || localStorage.getItem('gemini_api_key') || undefined
      const res = await sendAiChatMessageAction(query, messages.filter(m => m.id !== 'welcome'), activeKey)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: 'Desculpe, ocorreu uma falha de conexão com a IA. Tente novamente em instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    '💡 Como dar entrada no estoque?',
    '🔧 Qual a margem recomendada para peças?',
    '🚗 Como cadastrar um novo orçamento?'
  ]

  // Formatar texto simples com negrito e quebras de linha
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n')
    return lines.map((line, lIdx) => {
      // Tratar marcações de negrito **texto**
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>
        }
        return part
      })

      return (
        <React.Fragment key={lIdx}>
          {line.startsWith('- ') ? (
            <div className="flex items-start space-x-1.5 ml-2 my-0.5">
              <span className="text-blue-400 font-bold">•</span>
              <span>{formattedLine}</span>
            </div>
          ) : (
            <div>{formattedLine}</div>
          )}
        </React.Fragment>
      )
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group border border-white/20"
        title="Abrir Assistente IA da Oficina"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-white animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 absolute -top-1 -right-1" />
        </div>
        <span className="font-semibold text-sm tracking-wide hidden sm:inline">Assistente IA</span>
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[400px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
        isMinimized ? 'h-14' : 'h-[540px] max-h-[85vh]'
      }`}
    >
      {/* Cabeçalho */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm text-slate-100">Assistente da Oficina</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Gemini IA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Inteligência Automotiva</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition ${
              showSettings ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Configurar Chave Gemini API"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            title="Fechar Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && !isMinimized && (
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 text-xs">
          <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
            <span>Chave Gemini API (Começa com AIzaSy...):</span>
            {savedKeySuccess && <span className="text-emerald-400 font-bold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Salva!</span>}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="password"
              value={customKey}
              onChange={e => saveApiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy..."
              className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Obtenha sua chave gratuita em: https://aistudio.google.com/</p>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-sm">
            {messages.map(msg => {
              const isUser = msg.role === 'user'
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                    }`}
                  >
                    <div className="leading-relaxed whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>
                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/90 text-slate-300 border border-slate-700/60 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-xs font-medium text-slate-400">Processando resposta com Gemini IA...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          {messages.length < 4 && (
            <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap text-[11px] px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700/80 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Área de Entrada */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte ao Assistente IA..."
                disabled={loading}
                className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-40 transition flex items-center justify-center shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
