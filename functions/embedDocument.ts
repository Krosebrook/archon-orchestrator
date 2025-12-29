import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate embeddings for a document and store in vector database
 * Supports multiple chunking strategies and vector providers
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_id, knowledge_base_id } = await req.json();
    
    if (!document_id || !knowledge_base_id) {
      return Response.json({ 
        error: 'document_id and knowledge_base_id are required' 
      }, { status: 400 });
    }

    // Fetch document and knowledge base
    const [docs, kbs] = await Promise.all([
      base44.asServiceRole.entities.Document.filter({ id: document_id }),
      base44.asServiceRole.entities.KnowledgeBase.filter({ id: knowledge_base_id })
    ]);

    if (!docs.length || !kbs.length) {
      return Response.json({ error: 'Document or KnowledgeBase not found' }, { status: 404 });
    }

    const document = docs[0];
    const kb = kbs[0];

    // Update document status to processing
    await base44.asServiceRole.entities.Document.update(document_id, {
      status: 'processing'
    });

    // Chunk the document
    const chunks = chunkDocument(
      document.content, 
      kb.chunking_config || { strategy: 'semantic', chunk_size: 1000, chunk_overlap: 200 }
    );

    // Generate embeddings for each chunk
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const embeddingModel = kb.vector_config.embedding_model || 'text-embedding-3-small';
    const embeddings = [];

    for (const chunk of chunks) {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: chunk.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      embeddings.push({
        id: `${document_id}_chunk_${chunk.index}`,
        values: data.data[0].embedding,
        metadata: {
          document_id,
          knowledge_base_id,
          chunk_index: chunk.index,
          text: chunk.text,
          title: document.title,
          ...document.metadata,
        },
      });
    }

    // Store in vector database (simplified - would integrate with actual provider)
    // In production, this would use Pinecone, Weaviate, etc. SDK
    const vectorStorageResult = await storeVectors(kb.vector_config, embeddings);

    // Update document with chunk IDs
    await base44.asServiceRole.entities.Document.update(document_id, {
      status: 'indexed',
      chunk_ids: embeddings.map(e => e.id),
      chunk_count: embeddings.length,
      indexed_at: new Date().toISOString(),
    });

    // Update knowledge base stats
    await base44.asServiceRole.entities.KnowledgeBase.update(knowledge_base_id, {
      document_count: (kb.document_count || 0) + 1,
      total_chunks: (kb.total_chunks || 0) + embeddings.length,
      last_indexed: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      document_id,
      chunks_created: embeddings.length,
      vector_ids: embeddings.map(e => e.id),
    });

  } catch (error) {
    console.error('Embedding error:', error);
    
    // Try to update document status to failed
    try {
      const base44 = createClientFromRequest(req);
      const { document_id } = await req.json();
      if (document_id) {
        await base44.asServiceRole.entities.Document.update(document_id, {
          status: 'failed',
          error_message: error.message,
        });
      }
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }

    return Response.json({ 
      error: error.message,
      trace_id: `EMBED_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

/**
 * Chunk document based on strategy
 */
function chunkDocument(content, config) {
  const { strategy = 'semantic', chunk_size = 1000, chunk_overlap = 200 } = config;
  const chunks = [];

  if (strategy === 'fixed') {
    // Simple fixed-size chunking
    for (let i = 0; i < content.length; i += (chunk_size - chunk_overlap)) {
      chunks.push({
        index: chunks.length,
        text: content.slice(i, i + chunk_size),
      });
    }
  } else if (strategy === 'semantic') {
    // Split by paragraphs/sentences, respecting size limits
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';
    
    for (const para of paragraphs) {
      if ((currentChunk + para).length > chunk_size && currentChunk) {
        chunks.push({
          index: chunks.length,
          text: currentChunk.trim(),
        });
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    
    if (currentChunk) {
      chunks.push({
        index: chunks.length,
        text: currentChunk.trim(),
      });
    }
  } else if (strategy === 'recursive') {
    // Recursive splitting by different separators
    const separators = ['\n\n', '\n', '. ', ' '];
    chunks.push(...recursiveSplit(content, separators, chunk_size, chunks.length));
  }

  return chunks;
}

function recursiveSplit(text, separators, maxSize, startIndex) {
  if (text.length <= maxSize) {
    return [{ index: startIndex, text }];
  }

  const [currentSep, ...remainingSeps] = separators;
  if (!currentSep) {
    // No more separators, force split
    return [{ index: startIndex, text: text.slice(0, maxSize) }];
  }

  const parts = text.split(currentSep);
  const chunks = [];
  let currentChunk = '';

  for (const part of parts) {
    if ((currentChunk + part).length > maxSize && currentChunk) {
      chunks.push({ index: startIndex + chunks.length, text: currentChunk.trim() });
      currentChunk = part;
    } else {
      currentChunk += (currentChunk ? currentSep : '') + part;
    }
  }

  if (currentChunk) {
    chunks.push({ index: startIndex + chunks.length, text: currentChunk.trim() });
  }

  return chunks;
}

/**
 * Store vectors in configured provider
 * In production, integrate with actual vector DB SDKs
 */
async function storeVectors(vectorConfig, embeddings) {
  const { provider, index_name } = vectorConfig;
  
  // Mock implementation - replace with actual provider integration
  console.log(`Storing ${embeddings.length} vectors in ${provider}/${index_name}`);
  
  // Example Pinecone integration:
  // const pinecone = new Pinecone({ apiKey: Deno.env.get('PINECONE_API_KEY') });
  // const index = pinecone.Index(index_name);
  // await index.upsert(embeddings);
  
  return { success: true, count: embeddings.length };
}