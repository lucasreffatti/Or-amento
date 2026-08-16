'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ChatMessage {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: string
}

export async function sendAiChatMessageAction(
  userMessage: string,
  history: ChatMessage[] = [],
  customApiKey?: string
): Promise<{ text: string }> {
  try {
    const session = await getSession()
    const apiKey =
      customApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_KEY

    // Coletar contexto básico da oficina para personalizar respostas da IA
    const [stockCount, budgetsCount, vehiclesCount] = await Promise.all([
      prisma.stockItem.count({ where: { tenantId: session.tenantId } }).catch(() => 0),
      prisma.budget.count({ where: { tenantId: session.tenantId } }).catch(() => 0),
      prisma.vehicle.count({ where: { tenantId: session.tenantId } }).catch(() => 0)
    ])

    if (!apiKey) {
      return {
        text: `⚠️ **Chave de API Ausente**\n\nInsira sua chave no Assistente de IA clicando no ícone de engrenagem ⚙️ acima!`
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    let model
    try {
      model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: `Você é o "Mecânico IA", o assistente virtual inteligente e especialista para oficinas mecânicas de automóveis e gestão de autopeças.
Você ajuda o mecânico ou gestor da oficina com:
- Dúvidas sobre códigos de peças, diagnósticos automotivos e manutenção.
- Dicas de margem de lucro, precificação e orçamentos.
- Orientação sobre uso do sistema de gestão (estoque, recepção de veículos, checklists e impressão de orçamentos).

Dados atuais da Oficina do Usuário:
- Itens cadastrados no estoque: ${stockCount}
- Orçamentos no sistema: ${budgetsCount}
- Veículos no sistema: ${vehiclesCount}

Responda sempre em português do Brasil de forma direta, amigável, profissional e formatada com marcações em negrito e tópicos quando útil.`
      })
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    }

    // Montar histórico de mensagens formatado para a SDK
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }))

    const chat = model.startChat({
      history: formattedHistory
    })

    const result = await chat.sendMessage(userMessage)
    const responseText = result.response.text()

    return { text: responseText }
  } catch (error: any) {
    console.error('Erro no Chat com Gemini IA:', error)
    return {
      text: `Ops! Tive um problema ao conectar com a IA do Gemini: ${error.message || 'Erro de conexão'}. Verifique se a chave de API é válida.`
    }
  }
}
