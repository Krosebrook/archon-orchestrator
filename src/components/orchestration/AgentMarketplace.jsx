import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Store, Search, Brain, Plus, CheckCircle2, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AgentMarketplace({ onAgentSelect }) {
  const [agents, setAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await base44.entities.Agent.list();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const categories = ['all', 'general', 'code', 'data', 'creative', 'analysis'];

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.config?.capabilities?.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           agent.config?.capabilities?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const getAgentRating = (agent) => {
    // Mock rating calculation - in production, calculate from metrics
    return 4.5;
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Store className="w-5 h-5" />
          Agent Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or capability..."
            className="pl-9 bg-slate-800 border-slate-700"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? '' : 'border-slate-700'}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredAgents.map((agent) => {
            const rating = getAgentRating(agent);
            const isActive = agent.status === 'active';

            return (
              <div key={agent.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                      <Brain className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{agent.name}</span>
                        {isActive && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {agent.config?.provider}/{agent.config?.model}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-slate-300">{rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAgentSelect?.(agent)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {agent.config?.capabilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {agent.config.capabilities.map((cap, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}