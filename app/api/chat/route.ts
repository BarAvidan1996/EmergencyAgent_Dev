import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from '@langchain/openai'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const SUPABASE_URL = 'https://lfmxtaefgvjbuipcdcya.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI5ODk0OSwiZXhwIjoyMDU5ODc0OTQ5fQ.i8Z7Z2ee7_kYCWBtBELuKL1M3wg6Pj_1aRF_BpIyQ8Y'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const llm = new OpenAI({ 
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0
})
const fallbackLLM = new OpenAI({ 
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0
})
const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY })

const PROMPT_TEMPLATE = `
אתה עוזר חכם לפיקוד העורף בישראל.
המטרה שלך היא לספק תשובות מדויקות, אמינות ועדכניות לשאלות הקשורות למצבי חירום בישראל.

🔹 השתמש אך ורק במידע המובא למטה.  
🔹 אם אין במידע תשובה ברורה — ציין במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."
🔹 כתוב בעברית תקנית, רהוטה ורשמית, בסגנון המתאים לפרסום של רשות ממשלתית.
🔹 סדר את התשובה בצורה ברורה, עם סעיפים ממוספרים אם צריך.
🔹 בסיום התשובה, הוסף שורת מקורות עם שמות הקבצים שהתבססת עליהם.

📄 מידע רלוונטי:
{context}

❓ שאלה:
{question}

📝 תשובה:
`;

const STEPBACK_PROMPT_TEMPLATE = `
לפני שתענה ישירות על השאלה, קח צעד אחורה:
1. נתח את ההקשר הכללי של המצב.
2. קבע מהו המידע הקריטי שחייב להופיע בתשובה.
3. התמקד בהנחיות ברורות ומעשיות לשואל.

🔹 כתוב בעברית תקנית, רהוטה ורשמית.
🔹 ענה אך ורק בהתבסס על המידע הבא.

📄 מידע רלוונטי:
{context}

❓ שאלה:
{question}

📝 תשובה:
`

const prompt = new PromptTemplate({
  template: PROMPT_TEMPLATE,
  inputVariables: ['context', 'question']
})

const stepbackPrompt = new PromptTemplate({
  template: STEPBACK_PROMPT_TEMPLATE,
  inputVariables: ['context', 'question']
})

async function searchSimilarDocuments(question: string, matchThreshold = 0.75, matchCount = 5) {
  const embedding = await embeddings.embedQuery(question)
  
  const { data: documents, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount
  })

  if (error) throw error
  return documents
}

function buildContextFromResults(results) {
  if (!results || results.length === 0) return '';

  // קח עד 5 תוצאות
  const limitedResults = results.slice(0, 5);

  // קח מכל תוצאה עד 500 תווים
  const limitedTexts = limitedResults.map(doc => {
    const title = doc.title ? `Title: ${doc.title}\n` : '';
    const text = doc.plain_text || '';
    const limitedText = text.length > 500 ? text.slice(0, 500) : text;
    return `${title}${limitedText}`;
  });

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    
    // Search for relevant documents
    const results = await searchSimilarDocuments(message)
    
    if (!results || results.length === 0) {
      // Fallback to general knowledge if no relevant documents found
      const fallbackResponse = await fallbackLLM.call(
        `Answer this question using general knowledge only:\n\n${message}\n\nNote: Add a disclaimer that this is based on general knowledge and not official documents.`
      )
      return NextResponse.json({ 
        answer: fallbackResponse + '\n\n(התשובה מבוססת על ידע כללי ואינה נתמכת במסמכים רשמיים)',
        sources: [],
        source_type: 'fallback'
      })
    }

    // Build context from results
    const context = buildContextFromResults(results)
    
    // Generate response using stepback prompt
    const stepbackPromptValue = await stepbackPrompt.format({
      context,
      question: message
    })
    
    const response = await llm.call(stepbackPromptValue)
    
    // Return response with sources
    return NextResponse.json({
      answer: response,
      sources: results.map(r => r.title),
      source_type: 'stepback'
    })

  } catch (error) {
    console.error('Error in chat endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
} 