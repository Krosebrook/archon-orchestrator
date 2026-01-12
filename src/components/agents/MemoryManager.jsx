import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Search, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MemoryManager({ agentId }) {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [contextQuery, setContextQuery] = useState('');
  const [relevantMemories, setRelevantMemories] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newMemory, setNewMemory] = useState({
    memory_type: 'long_term',
    content: '',
    context: '',
    importance: 50,
    tags: ''
  });

  useEffect(() => {
    loadMemories();
  }, [agentId]);

  const loadMemories = async () => {
    try {
      const data = await base44.entities.AgentMemory.filter(
        { agent_id: agentId },
        '-created_date',
        100
      );
      setMemories(data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const addMemory = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.AgentMemory.create({
        agent_id: agentId,
        memory_type: newMemory.memory_type,
        content: { text: newMemory.content },
        context: newMemory.context,
        importance: newMemory.importance,
        tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean),
        expires_at: newMemory.memory_type === 'short_term' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : null,
        org_id: user.organization?.id || 'org_default'
      });

      toast.success('Memory added');
      setIsAdding(false);
      setNewMemory({ memory_type: 'long_term', content: '', context: '', importance: 50, tags: '' });
      loadMemories();
    } catch (error) {
      console.error('Failed to add memory:', error);
      toast.error('Failed to add memory');
    }
  };

  const deleteMemory = async (memoryId) => {
    try {
      await base44.entities.AgentMemory.delete(memoryId);
      toast.success('Memory deleted');
      loadMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
      toast.error('Failed to delete memory');
    }
  };

  const semanticSearch = async () => {
    if (!contextQuery.trim()) {
      toast.error('Please provide a context query');
      return;
    }

    setIsSearching(true);
    try {
      const memoryTexts = memories.map(m => ({
        id: m.id,
        text: `${m.content?.text || ''} [Context: ${m.context || 'none'}] [Tags: ${m.tags?.join(', ') || 'none'}]`,
        type: m.memory_type,
        importance: m.importance,
        created: m.created_date
      }));

      const prompt = `Given the following context: "${contextQuery}"

Analyze these agent memories and identify the most relevant ones:

${memoryTexts.map((m, idx) => `${idx + 1}. [${m.type}] ${m.text}`).join('\n')}

Return the top 5 most relevant memory IDs based on semantic similarity and importance to the given context. Consider both semantic meaning and practical relevance.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            relevant_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of memory IDs ranked by relevance'
            },
            reasoning: {
              type: 'string',
              description: 'Brief explanation of why these memories are relevant'
            }
          },
          required: ['relevant_ids', 'reasoning']
        }
      });

      const relevantIds = result.relevant_ids || [];
      const relevant = memories.filter(m => relevantIds.includes(m.id));
      
      setRelevantMemories(relevant);
      toast.success(`Found ${relevant.length} relevant memories`);
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      toast.error('Failed to search memories');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesType = selectedType === 'all' || m.memory_type === selectedType;
    const matchesSearch = !searchQuery || 
      m.content?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const memoryStats = {
    short_term: memories.filter(m => m.memory_type === 'short_term').length,
    long_term: memories.filter(m => m.memory_type === 'long_term').length,
    episodic: memories.filter(m => m.memory_type === 'episodic').length,
    semantic: memories.filter(m => m.memory_type === 'semantic').length
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Agent Memory
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="browse">Browse Memories</TabsTrigger>
            <TabsTrigger value="semantic">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Retrieval
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Short-term</div>
            <div className="text-lg font-bold text-white">{memoryStats.short_term}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Long-term</div>
            <div className="text-lg font-bold text-white">{memoryStats.long_term}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Episodic</div>
            <div className="text-lg font-bold text-white">{memoryStats.episodic}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Semantic</div>
            <div className="text-lg font-bold text-white">{memoryStats.semantic}</div>
          </div>
        </div>

        {isAdding && (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div className="space-y-2">
              <select
                value={newMemory.memory_type}
                onChange={(e) => setNewMemory({ ...newMemory, memory_type: e.target.value })}
                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="short_term">Short-term (24h)</option>
                <option value="long_term">Long-term</option>
                <option value="episodic">Episodic</option>
                <option value="semantic">Semantic</option>
              </select>
            </div>
            <Textarea
              value={newMemory.content}
              onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
              placeholder="Memory content..."
              className="bg-slate-800 border-slate-700 resize-none"
              rows={3}
            />
            <Input
              value={newMemory.context}
              onChange={(e) => setNewMemory({ ...newMemory, context: e.target.value })}
              placeholder="Context (e.g., customer conversation, task completion)"
              className="bg-slate-800 border-slate-700"
            />
            <Input
              value={newMemory.tags}
              onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
              placeholder="Tags (comma-separated)"
              className="bg-slate-800 border-slate-700"
            />
            <div className="flex gap-2">
              <Button onClick={addMemory} className="bg-green-600 hover:bg-green-700">
                Save Memory
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="bg-slate-800 border-slate-700 pl-9"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="short_term">Short-term</option>
            <option value="long_term">Long-term</option>
            <option value="episodic">Episodic</option>
            <option value="semantic">Semantic</option>
          </select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMemories.map((memory) => (
            <div key={memory.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    {memory.memory_type}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                    Importance: {memory.importance}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMemory(memory.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
              {memory.context && (
                <p className="text-xs text-slate-500 mb-2">Context: {memory.context}</p>
              )}
              {memory.tags && memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {memory.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{format(new Date(memory.created_date), 'MMM d, h:mm a')}</span>
                {memory.access_count > 0 && <span>Accessed {memory.access_count}x</span>}
              </div>
            </div>
          ))}
        </div>
          </TabsContent>

          <TabsContent value="semantic" className="space-y-4 mt-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">AI-Powered Memory Retrieval</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Describe your current context or task, and AI will find the most relevant memories semantically.
              </p>
              <Textarea
                value={contextQuery}
                onChange={(e) => setContextQuery(e.target.value)}
                placeholder="E.g., 'Working on customer support ticket about billing issues' or 'Planning Q4 marketing campaign'"
                className="bg-slate-800 border-slate-700 resize-none"
                rows={3}
              />
              <Button
                onClick={semanticSearch}
                disabled={isSearching || !contextQuery.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find Relevant Memories
                  </>
                )}
              </Button>
            </div>

            {relevantMemories.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Relevant Memories</h3>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {relevantMemories.length} found
                  </Badge>
                </div>
                {relevantMemories.map((memory, idx) => (
                  <div key={memory.id} className="p-3 bg-gradient-to-br from-purple-900/10 to-slate-950 rounded-lg border border-purple-500/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          #{idx + 1}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {memory.memory_type}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                          Importance: {memory.importance}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMemory(memory.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
                    {memory.context && (
                      <p className="text-xs text-slate-500 mb-2">Context: {memory.context}</p>
                    )}
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {memory.tags.map((tag, tagIdx) => (
                          <span key={tagIdx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{format(new Date(memory.created_date), 'MMM d, h:mm a')}</span>
                      {memory.access_count > 0 && <span>Accessed {memory.access_count}x</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}