import React, { useState, useEffect } from 'react';
import { WorkflowTemplate } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Filter, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TemplateLibrary from '../components/templates/TemplateLibrary';
import { toast } from 'sonner';

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await WorkflowTemplate.list('-usage_count');
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'data_processing', label: 'Data Processing' },
    { value: 'content_generation', label: 'Content Generation' },
    { value: 'automation', label: 'Automation' },
    { value: 'integration', label: 'Integration' },
    { value: 'analytics', label: 'Analytics' }
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredTemplates = filteredTemplates.filter(t => t.is_featured);
  const otherTemplates = filteredTemplates.filter(t => !t.is_featured);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Workflow Templates
          </h1>
          <p className="text-slate-400">Pre-built workflow patterns ready to customize</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl('TemplateCustomizer'))}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Customization Hub
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {featuredTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Featured Templates</h2>
          </div>
          <TemplateLibrary templates={featuredTemplates} onRefresh={loadTemplates} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {featuredTemplates.length > 0 ? 'All Templates' : `${filteredTemplates.length} Templates`}
        </h2>
        <TemplateLibrary templates={otherTemplates} onRefresh={loadTemplates} />
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No templates found matching your criteria
        </div>
      )}
    </div>
  );
}