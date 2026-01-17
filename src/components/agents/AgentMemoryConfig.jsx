import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Brain, Trash2 } from 'lucide-react';
import { AgentMemory } from '@/entities/all';
import { toast } from 'sonner';

export default function AgentMemoryConfig({ agent, _onUpdate }) {
  const [memorySettings, setMemorySettings] = useState({
    enabled: true,
    retention_days: {
      short_term: 1,
      long_term: 365,
      episodic: 90,
      semantic: 730
    },
    max_memories: 10000,
    importance_threshold: 30,
    auto_cleanup: true
  });
  
  const [recentMemories, setRecentMemories] = useState([]);

  useEffect(() => {
    loadRecentMemories();
  }, [agent.id]);

  const loadRecentMemories = async () => {
    try {
      const memories = await AgentMemory.filter({ agent_id: agent.id }, '-created_date', 5);
      setRecentMemories(memories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      await AgentMemory.delete(memoryId);
      toast.success('Memory deleted');
      loadRecentMemories();
    } catch (error) {
      console.error('Failed to delete memory:', error);
      toast.error('Failed to delete memory');
    }
  };

  const handleClearAllMemories = async () => {
    if (!confirm('Clear all memories for this agent? This cannot be undone.')) {
      return;
    }

    try {
      const allMemories = await AgentMemory.filter({ agent_id: agent.id });
      await Promise.all(allMemories.map(m => AgentMemory.delete(m.id)));
      toast.success('All memories cleared');
      loadRecentMemories();
    } catch (error) {
      console.error('Failed to clear memories:', error);
      toast.error('Failed to clear memories');
    }
  };

  const memoryTypeColors = {
    short_term: 'bg-blue-500/20 text-blue-400',
    long_term: 'bg-green-500/20 text-green-400',
    episodic: 'bg-purple-500/20 text-purple-400',
    semantic: 'bg-orange-500/20 text-orange-400'
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Memory Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">Enable Memory System</Label>
              <p className="text-xs text-slate-500">Allow agent to store and retrieve memories</p>
            </div>
            <Switch
              checked={memorySettings.enabled}
              onCheckedChange={(checked) => setMemorySettings({ ...memorySettings, enabled: checked })}
            />
          </div>

          {memorySettings.enabled && (
            <>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <Label className="text-slate-300">Retention Periods (days)</Label>
                
                {Object.entries(memorySettings.retention_days).map(([type, days]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge variant="outline" className={memoryTypeColors[type]}>
                      {type.replace('_', ' ')}
                    </Badge>
                    <Input
                      type="number"
                      value={days}
                      onChange={(e) => setMemorySettings({
                        ...memorySettings,
                        retention_days: {
                          ...memorySettings.retention_days,
                          [type]: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-24 bg-slate-950 border-slate-700 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div>
                  <Label className="text-slate-300">Max Memories</Label>
                  <Input
                    type="number"
                    value={memorySettings.max_memories}
                    onChange={(e) => setMemorySettings({ ...memorySettings, max_memories: parseInt(e.target.value) || 1000 })}
                    className="mt-2 bg-slate-950 border-slate-700"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Importance Threshold (0-100)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={memorySettings.importance_threshold}
                    onChange={(e) => setMemorySettings({ ...memorySettings, importance_threshold: parseInt(e.target.value) || 30 })}
                    className="mt-2 bg-slate-950 border-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Memories below this importance are automatically pruned
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Auto-cleanup</Label>
                    <p className="text-xs text-slate-500">Automatically remove expired memories</p>
                  </div>
                  <Switch
                    checked={memorySettings.auto_cleanup}
                    onCheckedChange={(checked) => setMemorySettings({ ...memorySettings, auto_cleanup: checked })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Memories</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllMemories}
              className="border-slate-700 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentMemories.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No memories stored yet</p>
          ) : (
            <div className="space-y-2">
              {recentMemories.map(memory => (
                <div key={memory.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={memoryTypeColors[memory.memory_type]}>
                      {memory.memory_type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {typeof memory.content === 'string' ? memory.content : JSON.stringify(memory.content)}
                  </p>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {memory.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}