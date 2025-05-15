import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { JSDOM } from 'jsdom'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to extract text content from HTML
function extractTextFromHtml(htmlContent: string): string {
  const dom = new JSDOM(htmlContent)
  const text = dom.window.document.body.textContent || ''
  return text.trim()
}

// Function to create embedding
async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  return response.data[0].embedding
}

// Function to process a single file
async function processFile(filePath: string, language: string) {
  console.log(`Processing ${filePath}...`)
  
  const content = fs.readFileSync(filePath, 'utf-8')
  const text = extractTextFromHtml(content)
  
  // Split text into chunks of roughly 1000 characters
  const chunks = text.match(/.{1,1000}/g) || []
  
  for (const chunk of chunks) {
    try {
      const embedding = await createEmbedding(chunk)
      
      const { error } = await supabase
        .from('documents')
        .insert({
          content: chunk,
          embedding,
          metadata: {
            source: path.basename(filePath),
            language,
          },
        })
      
      if (error) throw error
      console.log(`Uploaded chunk from ${path.basename(filePath)}`)
    } catch (error) {
      console.error(`Error processing chunk from ${filePath}:`, error)
    }
  }
}

// Main function to process all files
async function main() {
  const hebrewDir = path.join(process.cwd(), 'public', 'data_sources', 'heb')
  const englishDir = path.join(process.cwd(), 'public', 'data_sources', 'en')
  
  // Process Hebrew files
  const hebrewFiles = fs.readdirSync(hebrewDir)
  for (const file of hebrewFiles) {
    if (file.endsWith('.html')) {
      await processFile(path.join(hebrewDir, file), 'he')
    }
  }
  
  // Process English files
  const englishFiles = fs.readdirSync(englishDir)
  for (const file of englishFiles) {
    if (file.endsWith('.html')) {
      await processFile(path.join(englishDir, file), 'en')
    }
  }
  
  console.log('Processing completed!')
}

// Run the script
main().catch(console.error) 