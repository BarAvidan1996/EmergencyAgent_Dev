const express = require('express');
const cors = require('cors');
const { ChatOpenAI } = require('@langchain/openai');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = 'https://lfmxtaefgvjbuipcdcya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXh0YWVmZ3ZqYnVpcGNkY3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTg5NDksImV4cCI6MjA1OTg3NDk0OX0.GfUDSLhxwdTEOKDyewAipXnZE_suNjKQba6x0q3QKEE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  try {
    const { data, error } = await supabase
      .from('rag_documents')
      .select('id, title, file_name')
      .limit(5);

    if (error) {
      console.error('❌ Error querying rag_documents:', error);
    } else {
      console.log('✅ Successfully fetched documents from rag_documents:');
      data.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.title} (${doc.file_name})`);
      });
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
})();

const llm = new ChatOpenAI({ 
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0,
  streaming: true
});
const fallbackLLM = new ChatOpenAI({ 
  openAIApiKey: OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0,
  streaming: true
});
const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });

const PROMPT_TEMPLATE = `
אתה עוזר חכם לפיקוד העורף בישראל.

המטרה שלך היא לספק תשובות מדויקות, ברורות ותמציתיות, בשפה שבה נשאלה השאלה: עברית תקנית ורשמית או אנגלית תקינה ורשמית.

אתה עוזר חכם לפיקוד העורף בישראל.

המטרה שלך היא לספק תשובות מדויקות, ברורות, תמציתיות, ובשפה תקנית גבוהה, מותאמת לפרסום רשמי מטעם רשות ממשלתית.

🔹 הנחיות חובה:
- ענה אך ורק על בסיס המידע המובא מטה.
- אם אין תשובה ברורה במידע — ציין במפורש: "לא נמצאה תשובה מבוססת במידע הנתון."
- סדר את הצעדים לפי סדר זמן והקשר:
  - התחל בפעולות מיידיות שיש לבצע במהלך האירוע.
  - המשך בפעולות שיש לבצע מיד לאחר סיום האירוע.
  - רק לאחר מכן, פרט הכנות או הרחבות כלליות (אם יש צורך).
- כתוב משפטים קצרים, ברורים, ללא חזרתיות וללא סרבול.
- שמור על עברית תקנית, רהוטה ורשמית, מותאמת להנחיות לציבור.
- אם המשתמש שאל באנגלית, ענה בשפה האנגלית.
- בסיום התשובה, הוסף שורת מקורות: "מקורות: [שמות הקבצים שהתבססו עליהם]".

🔹 דגשים נוספים:
- כתוב בלשון סביל (עברית) או Passive Voice (אנגלית) כשמתאים.
- הימנע מתיאורים רגשיים או המלצות כלליות לא הכרחיות.

📄 מידע רלוונטי:
{context}

❓ שאלה:
{question}

📝 תשובה:
`;

const STEPBACK_PROMPT_TEMPLATE = `
לפני כתיבת התשובה, בצע תהליך חשיבה קצר פנימי:

לפני כתיבת התשובה, בצע ניתוח פנימי קצר:

1. זיהוי הפעולות המיידיות והמעשיות ביותר להצלת חיים תוך כדי האירוע.
2. סדר את הצעדים לפי סדר זמן ברור:
   - פעולות דחופות במהלך האירוע.
   - פעולות מיידיות לאחר סיום האירוע.
   - רק לאחר מכן, הכנות והרחבות כלליות (אם יש צורך).
3. כתוב את התשובה ישירות - אין לתאר את שלבי החשיבה.

כללי ניסוח:
- כתוב עברית תקנית, רהוטה ורשמית (או באנגלית, אם השאלה באנגלית).
- תן עדיפות לברירות מיידיות והימנע מהכנסת מידע שאינו הכרחי.

📄 מידע רלוונטי:
{context}

❓ שאלה:
{question}

📝 תשובה:
`;

const prompt = new PromptTemplate({
  template: PROMPT_TEMPLATE,
  inputVariables: ['context', 'question']
});

const stepbackPrompt = new PromptTemplate({
  template: STEPBACK_PROMPT_TEMPLATE,
  inputVariables: ['context', 'question']
});

async function searchSimilarDocuments(question, matchThreshold = 0.75, matchCount = 5) {
  try {
    console.log("🔍 Generating embedding for question:", question);
    const embedding = await embeddings.embedQuery(question);
    console.log("✅ Generated embedding successfully");
    
    console.log("🔍 Searching for matches in Supabase...");
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error("❌ Error from match_documents RPC:", error);
      throw error;
    }

    console.log(`✅ Found ${documents?.length || 0} matches`);
    if (documents && documents.length > 0) {
      console.log("📄 First match:", {
        title: documents[0].title,
        similarity: documents[0].similarity
      });
    }

    return documents;
  } catch (error) {
    console.error("❌ Error in searchSimilarDocuments:", error);
    throw error;
  }
}

function buildContextFromResults(results) {
  if (!results || results.length === 0) return '';

  const limitedResults = results.slice(0, 5);

  const limitedTexts = limitedResults.map(doc => {
    const title = doc.title ? `Title: ${doc.title}\n` : '';
    const text = doc.plain_text || '';
    const limitedText = text.length > 500 ? text.slice(0, 500) : text;
    return `${title}${limitedText}`;
  });

  return limitedTexts.join('\n\n---\n\n');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log("\n🤖 Processing new chat message:", message);
    
    const results = await searchSimilarDocuments(message);
    
    console.log("🔎 Found documents:", results?.length);
    console.log("📝 First result:", results?.[0]);
    
    if (!results || results.length === 0) {
      console.log("ℹ️ No relevant documents found, using fallback");
      const fallbackResponse = await fallbackLLM.invoke(
        `ענה לשאלה הבאה לפי ידע כללי בלבד:\n\n${message}\n\n(הערה: תשובה זו מבוססת על ידע כללי ואינה נתמכת במסמכים רשמיים).`
      );
      return res.json({ 
        answer: fallbackResponse.content + "\n\nמקורות: אין (התבסס על ידע כללי בלבד)",
        sources: [],
        source_type: 'fallback'
      });
    }

    const context = buildContextFromResults(results);
    
    const stepbackPromptValue = await stepbackPrompt.format({
      context,
      question: message
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sourcesText = results.map(r => r.title || '(ללא כותרת)').join(', ');
    let fullAnswer = '';

    try {
      const stream = await llm.stream(stepbackPromptValue);
      for await (const chunk of stream) {
        const token = chunk?.content || '';
        fullAnswer += token;
        res.write(token);
      }
      res.write(`\n\nמקורות: ${sourcesText}`);
      res.end();
    } catch (streamError) {
      console.error('❌ Streaming error:', streamError);
      res.end('❌ שגיאה במהלך יצירת התשובה.');
    }
    return;

  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
