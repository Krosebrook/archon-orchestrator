import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Database, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

/**
 * RAG Node Component for Visual Workflow Builder
 * Allows agents to retrieve context from knowledge bases
 */
export default function RAGNode({ nodeData, onUpdate }) {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [config, setConfig] = useState({
    knowledge_base_id: nodeData?.config?.knowledge_base_id || '',
    query_template: nodeData?.config?.query_template || '{{user_input}}',
    top_k: nodeData?.config?.top_k || 5,
    min_score: nodeData?.config?.min_score || 0.7,
    use_context_in_prompt: nodeData?.config?.use_context_in_prompt !== false,
  });

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const kbs = await base44.entities.KnowledgeBase.filter({ status: 'active' });
      setKnowledgeBases(kbs);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const handleConfigChange = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdate?.({ config: newConfig });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          RAG Retrieval Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Knowledge Base</Label>
          <Select
            value={config.knowledge_base_id}
            onValueChange={(value) => handleConfigChange({ knowledge_base_id: value })}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select knowledge base" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {knowledgeBases.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  {kb.name} ({kb.document_count || 0} docs)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 mt-1">
            Vector database to search for relevant context
          </p>
        </div>

        <div>
          <Label className="text-slate-300">Query Template</Label>
          <Input
            value={config.query_template}
            onChange={(e) => handleConfigChange({ query_template: e.target.value })}
            placeholder="{{user_input}} or custom query"
            className="bg-slate-900 border-slate-700 text-white"
          />
          <p className="text-xs text-slate-400 mt-1">
            Use {'{{user_input}}'} for dynamic queries or write a fixed query
          </p>
        </div>

        <div>
          <Label className="text-slate-300">
            Top K Results: {config.top_k}
          </Label>
          <Slider
            value={[config.top_k]}
            onValueChange={([value]) => handleConfigChange({ top_k: value })}
            min={1}
            max={20}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-slate-400 mt-1">
            Number of relevant chunks to retrieve
          </p>
        </div>

        <div>
          <Label className="text-slate-300">
            Minimum Score: {config.min_score.toFixed(2)}
          </Label>
          <Slider
            value={[config.min_score * 100]}
            onValueChange={([value]) => handleConfigChange({ min_score: value / 100 })}
            min={0}
            max={100}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-slate-400 mt-1">
            Minimum similarity score (0-1) to include results
          </p>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Auto-inject into prompt</Label>
            <input
              type="checkbox"
              checked={config.use_context_in_prompt}
              onChange={(e) => handleConfigChange({ use_context_in_prompt: e.target.checked })}
              className="w-4 h-4"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatically include retrieved context in the agent's prompt
          </p>
        </div>

        <div className="pt-2 border-t border-slate-700 bg-slate-900/50 rounded p-3">
          <div className="text-xs font-medium text-slate-400 mb-2">How RAG Works:</div>
          <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
            <li>Query is embedded using OpenAI</li>
            <li>Vector search finds similar chunks</li>
            <li>Top K results are retrieved</li>
            <li>Context is injected into prompt</li>
            <li>Agent generates response with context</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RAG Node Type Definition for Workflow Builder
 * Export this to register the node type
 */
export const RAGNodeType = {
  type: 'rag_retrieval',
  label: 'RAG Retrieval',
  icon: Database,
  color: 'bg-purple-600',
  description: 'Retrieve relevant context from knowledge base',
  defaultConfig: {
    knowledge_base_id: '',
    query_template: '{{user_input}}',
    top_k: 5,
    min_score: 0.7,
    use_context_in_prompt: true,
  },
  inputs: ['query'],
  outputs: ['context', 'results'],
  component: RAGNode,
};