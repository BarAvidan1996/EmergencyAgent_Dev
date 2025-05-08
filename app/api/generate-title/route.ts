import { NextResponse } from 'next/server'
import { OpenAI } from '@langchain/openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

const llm = new OpenAI({ 
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0
})

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json()
    
    const prompt = `
Based on the following chat exchange, generate a concise and descriptive title (maximum 30 characters).
The title should capture the main topic or question being discussed.

User: ${question}

Answer: ${answer}

Generate a title in Hebrew that summarizes this exchange.
`

    const response = await llm.invoke(prompt)
    const title = response.trim()

    return NextResponse.json({ title })
  } catch (error) {
    console.error('Error generating title:', error)
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    )
  }
} 