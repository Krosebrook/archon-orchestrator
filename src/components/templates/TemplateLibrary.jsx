import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookTemplate, Search, Sparkles, Plus, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = ['automation', 'data-processing', 'customer-support', 'analytics', 'integration'];
const COMPLEXITY = ['beginner', 'intermediate', 'advanced'];

export default function TemplateLibrary({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, categoryFilter, complexityFilter]);

  const loadTemplates = async () => {
    try {
      const data = await base44.entities.WorkflowTemplate.list();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    if (complexityFilter !== 'all') {
      filtered = filtered.filter(t => t.complexity === complexityFilter);
    }

    setFilteredTemplates(filtered);
  };

  const instantiateTemplate = async (template) => {
    try {
      const user = await base44.auth.me();
      const workflow = await base44.entities.Workflow.create({
        name: `${template.name} (from template)`,
        description: template.description,
        spec: template.spec,
        version: '1.0.0',
        org_id: user.organization?.id || 'org_default'
      });

      toast.success('Workflow created from template');
      navigate(createPageUrl(`WorkflowDetail?id=${workflow.id}`));
    } catch (error) {
      console.error('Failed to instantiate template:', error);
      toast.error('Failed to create workflow');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BookTemplate className="w-5 h-5" />
          Template Library
        </CardTitle>
        <p className="text-sm text-slate-400">
          {filteredTemplates.length} templates available
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="bg-slate-800 border-slate-700 pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={complexityFilter} onValueChange={setComplexityFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 w-36">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Levels</SelectItem>
              {COMPLEXITY.map(comp => (
                <SelectItem key={comp} value={comp} className="capitalize">
                  {comp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookTemplate className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            No templates found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map(template => (
              <div key={template.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{template.name}</div>
                    <p className="text-xs text-slate-400 mb-2">{template.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs capitalize">
                    {template.complexity}
                  </Badge>
                  {template.tags?.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-slate-500 mb-3">
                  {template.spec?.nodes?.length || 0} nodes • Used {template.usage_count || 0} times
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => instantiateTemplate(template)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectTemplate?.(template)}
                    className="border-slate-700"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}