import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Retrieve relevant context from knowledge base using semantic search
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      knowledge_base_id, 
      query, 
      top_k = 5,
      agent_id,
      run_id,
      min_score = 0.7,
    } = await req.json();
    
    if (!knowledge_base_id || !query) {
      return Response.json({ 
        error: 'knowledge_base_id and query are required' 
      }, { status: 400 });
    }

    const startTime = Date.now();

    // Fetch knowledge base config
    const kbs = await base44.asServiceRole.entities.KnowledgeBase.filter({ 
      id: knowledge_base_id 
    });

    if (!kbs.length) {
      return Response.json({ error: 'KnowledgeBase not found' }, { status: 404 });
    }

    const kb = kbs[0];

    // Generate query embedding
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const embeddingModel = kb.vector_config.embedding_model || 'text-embedding-3-small';
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Query vector database
    const results = await queryVectors(
      kb.vector_config,
      queryEmbedding,
      top_k,
      { knowledge_base_id }
    );

    // Filter by minimum score
    const filteredResults = results.filter(r => r.score >= min_score);

    // Log retrieval for analytics
    await base44.asServiceRole.entities.RetrievalLog.create({
      knowledge_base_id,
      query,
      query_embedding: queryEmbedding,
      results: filteredResults.map(r => ({
        document_id: r.metadata.document_id,
        chunk_id: r.id,
        content: r.metadata.text,
        score: r.score,
        metadata: r.metadata,
      })),
      top_k,
      latency_ms: Date.now() - startTime,
      agent_id,
      run_id,
      timestamp: new Date().toISOString(),
      org_id: user.organization.id,
    });

    // Format results for agent consumption
    const contextChunks = filteredResults.map(r => ({
      content: r.metadata.text,
      source: r.metadata.title,
      score: r.score,
      metadata: r.metadata,
    }));

    return Response.json({
      success: true,
      query,
      results: contextChunks,
      total_results: filteredResults.length,
      latency_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Retrieval error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `RETRIEVE_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

/**
 * Query vector database for similar chunks
 * In production, integrate with actual vector DB SDKs
 */
async function queryVectors(vectorConfig, queryEmbedding, topK, filter) {
  const { provider, index_name } = vectorConfig;
  
  // Mock implementation - replace with actual provider integration
  console.log(`Querying ${provider}/${index_name} for top ${topK} results`);
  
  // Example Pinecone integration:
  // const pinecone = new Pinecone({ apiKey: Deno.env.get('PINECONE_API_KEY') });
  // const index = pinecone.Index(index_name);
  // const queryResponse = await index.query({
  //   vector: queryEmbedding,
  //   topK,
  //   filter,
  //   includeMetadata: true,
  // });
  // return queryResponse.matches;
  
  // Mock results
  return [
    {
      id: 'chunk_001',
      score: 0.92,
      metadata: {
        document_id: 'doc_001',
        text: 'Sample relevant context from knowledge base...',
        title: 'Sample Document',
      },
    },
    {
      id: 'chunk_002',
      score: 0.88,
      metadata: {
        document_id: 'doc_002',
        text: 'Another relevant piece of information...',
        title: 'Another Document',
      },
    },
  ];
}