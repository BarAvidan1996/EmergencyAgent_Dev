-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create a table for storing documents and their embeddings
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),  -- OpenAI's text-embedding-ada-002 creates vectors of 1536 dimensions
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for similar documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  file_name text,
  title text,
  plain_text text,
  similarity float
)
language sql stable
as $$
  select
    id,
    file_name,
    title,
    plain_text,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  where 1 - (rag_documents.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$; 